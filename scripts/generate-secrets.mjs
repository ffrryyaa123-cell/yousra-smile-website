import { randomBytes } from 'node:crypto';
import { writeFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const outputPath = resolve(process.cwd(), '.env.generated');

if (existsSync(outputPath)) {
  console.error('رفض إنشاء ملف جديد لأن .env.generated موجود بالفعل. انقليه أو احذفيه ثم أعيدي المحاولة.');
  process.exit(1);
}

const randomBase64Url = (bytes) => randomBytes(bytes).toString('base64url');
const randomHex = (bytes) => randomBytes(bytes).toString('hex');

const adminPassword = `Ys!${randomBase64Url(15)}`;
const sessionSecret = randomBase64Url(48);
const tokenEncryptionKey = randomHex(32);
const bootstrapToken = randomBase64Url(32);

const file = `# Generated locally for Yousra Smile\n# Never commit this file to GitHub.\n\nAPP_URL="https://yousrasmile.com"\nCONTACT_EMAIL="info@yousrasmile.com"\nADMIN_EMAIL="info@yousrasmile.com"\nADMIN_TEMP_PASSWORD="${adminPassword}"\nADMIN_BOOTSTRAP_TOKEN="${bootstrapToken}"\nFORCE_ADMIN_PASSWORD_RESET="true"\n\nSESSION_SECRET="${sessionSecret}"\nTOKEN_ENCRYPTION_KEY="${tokenEncryptionKey}"\n\nGEMINI_API_KEY=""\n\nVITE_SUPABASE_URL=""\nVITE_SUPABASE_PUBLISHABLE_KEY=""\nVITE_SUPABASE_ANON_KEY=""\nSUPABASE_SERVICE_ROLE_KEY=""\n\nSMTP_HOST="smtp.hostinger.com"\nSMTP_PORT="465"\nSMTP_SECURE="true"\nSMTP_USER="info@yousrasmile.com"\nSMTP_PASS=""\nSMTP_FROM="Yousra Smile <info@yousrasmile.com>"\n\nYOUTUBE_CLIENT_ID=""\nYOUTUBE_CLIENT_SECRET=""\nTIKTOK_CLIENT_KEY=""\nTIKTOK_CLIENT_SECRET=""\nPINTEREST_APP_ID=""\nPINTEREST_APP_SECRET=""\nMETA_APP_ID=""\nMETA_APP_SECRET=""\nX_CLIENT_ID=""\nX_CLIENT_SECRET=""\n`;

writeFileSync(outputPath, file, { encoding: 'utf8', mode: 0o600, flag: 'wx' });

console.log('تم إنشاء .env.generated بنجاح.');
console.log('البريد الإداري: info@yousrasmile.com');
console.log('افتحي الملف محليًا وانسخي القيم إلى إعدادات الاستضافة.');
console.log('بعد أول دخول، غيّري كلمة مرور المدير واحذفي ADMIN_TEMP_PASSWORD من إعدادات الاستضافة.');
