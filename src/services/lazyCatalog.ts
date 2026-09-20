type CatalogDatabase = typeof import('./supabaseCatalog')['catalogDatabase'];

let catalogPromise: Promise<CatalogDatabase> | null = null;

const loadCatalog = (): Promise<CatalogDatabase> => {
  if (!catalogPromise) {
    catalogPromise = import('./supabaseCatalog').then(module => module.catalogDatabase);
  }
  return catalogPromise;
};

type SubscriptionMethod = 'subscribeProducts' | 'subscribeVideos';

const subscribeLater = (method: SubscriptionMethod, args: unknown[]): (() => void) => {
  let stopped = false;
  let unsubscribe = () => undefined;

  void loadCatalog()
    .then(database => {
      if (stopped) return;
      const subscribe = database[method] as (...parameters: unknown[]) => () => void;
      unsubscribe = subscribe(...args);
    })
    .catch(error => {
      const onError = args[1];
      if (typeof onError === 'function') onError(error);
      else console.error(error);
    });

  return () => {
    stopped = true;
    unsubscribe();
  };
};

const subscriptionFacade = {
  subscribeProducts: (...args: unknown[]) => subscribeLater('subscribeProducts', args),
  subscribeVideos: (...args: unknown[]) => subscribeLater('subscribeVideos', args),
};

/**
 * Keeps the public catalog API unchanged while moving the Supabase SDK out of
 * the first-render JavaScript path. Reads and writes still use the exact same
 * database service; the module is requested after React has painted.
 */
export const catalogDatabase = new Proxy(subscriptionFacade, {
  get(target, property, receiver) {
    if (property in target) return Reflect.get(target, property, receiver);
    return (...args: unknown[]) => loadCatalog().then(database => {
      const method = database[property as keyof CatalogDatabase];
      if (typeof method !== 'function') throw new Error(`Unknown catalog method: ${String(property)}`);
      return (method as (...parameters: unknown[]) => unknown)(...args);
    });
  },
}) as unknown as CatalogDatabase;
