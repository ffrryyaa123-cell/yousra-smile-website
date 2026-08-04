import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();
  app.use(express.json());

  // Initialize Gemini AI SDK
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY || "",
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API Route: Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // API Route: AI Product Copywriter & SEO Assistant
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { productName, productCategory, extraDetails, contentType = 'product' } = req.body;

      if (contentType === 'product' && (!productName || productName.trim() === "")) {
        return res.status(400).json({ error: "اسم المنتج مطلوب لتشغيل المساعد الذكي." });
      }

      if (contentType === 'blog' && (!productName || productName.trim() === "")) {
        return res.status(400).json({ error: "عنوان أو موضوع المقال مطلوب لتشغيل المساعد الذكي." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ 
          error: "عذراً، لم يتم العثور على مفتاح API الخاص بـ Gemini (GEMINI_API_KEY) في إعدادات الخادم." 
        });
      }

      let prompt = "";
      let responseSchema: any = {};
      let systemInstruction = "";

      if (contentType === 'blog') {
        systemInstruction = "أنت كاتب مقالات ومدونات محترف ومتخصص في تهيئة محركات البحث للأجهزة والمنتجات التقنية المنزلية والعصرية. تكتب بلغة عربية فصحى ممتازة وبأسلوب ممتع ومقنع يجذب القراء ويدفعهم لاتخاذ قرار الشراء.";
        prompt = `
        أنت خبير كاتب محتوى تسويقي ومدون محترف لمنصة "يسرى سمايل" (Yousra Smile) المتخصصة في مراجعات الأجهزة المنزلية الذكية والمنزل العصري.
        
        المهمة: قم بإنشاء مقال/دليل شراء تفصيلي متكامل ومهيأ بالكامل للـ SEO ومقنع للقراءة باللغة العربية الفصحى حول الموضوع التالي:
        - العنوان المقترح أو الفكرة: ${productName}
        - القسم المقترح للمقال: ${productCategory || "دليل الشراء"}
        - تفاصيل إضافية أو نقاط رئيسية تريد تضمينها: ${extraDetails || "لا توجد تفاصيل إضافية"}

        يجب أن يتضمن الإخراج هيكلاً منسقاً بدقة يحتوي على العناوين والوصف والملخص والمحتوى المنسق ماركداون والوسوم والهاشتاقات وملاحظة هامة جداً على الصورة المناسبة لهذا المقال.
        `;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            seoTitle: { 
              type: Type.STRING, 
              description: "عنوان مقال مذهل ومهيأ للـ SEO وجذاب للنقر باللغة العربية (مثال: 'دليل شامل: أفضل 5 مكانس روبوتية لعام 2026')" 
            },
            seoDescription: { 
              type: Type.STRING, 
              description: "وصف ميتا (Meta Description) للمقال لا يتجاوز 160 حرفاً يوضح الفائدة الرئيسية للقارئ." 
            },
            summaryAr: { 
              type: Type.STRING, 
              description: "ملخص قصير وجذاب للمقال يظهر في قائمة المقالات كنبذة تعريفية سريعة (من 2 إلى 3 أسطر)." 
            },
            category: { 
              type: Type.STRING, 
              description: "اسم القسم المناسب للمقال باللغة العربية (مثال: 'المكانس الروبوتية' أو 'المطبخ العصري')." 
            },
            readTime: { 
              type: Type.STRING, 
              description: "الوقت المقدر للقراءة باللغة العربية (مثال: '5 دقائق قراءة' أو '4 دقائق قراءة')." 
            },
            contentAr: { 
              type: Type.STRING, 
              description: "المحتوى الكامل للمقال المنسق بلغة ماركداون (Markdown) غني بالعناوين الفرعية والمقارنات والنقاط الهامة، ويحتوي على نصيحة ذهبية من 'يسرى سمايل' لشراء ذكي." 
            },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة من 5 وسوم للمقال بدون رمز الهاشتاق (مثال: ['دليل شراء', 'مكانس ذكية', 'أتمتة المنزل'])." 
            },
            hashtags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة من 5 هاشتاقات شائعة على المنصات تبدأ برمز # (مثال: ['#يسرى_سمايل', '#توفير_الطاقة', '#منزل_ذكي'])." 
            },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "الكلمات المفتاحية الأساسية لـ SEO للبحث عن هذا المقال." 
            },
            imageNote: { 
              type: Type.STRING, 
              description: "ملاحظة فنية واحترافية حول نوع الصورة الأنسب المصاحبة للمقال لتظهر بشكل مميز وجذاب للقراء." 
            }
          },
          required: ["seoTitle", "seoDescription", "summaryAr", "category", "readTime", "contentAr", "tags", "hashtags", "keywords", "imageNote"]
        };
      } else {
        systemInstruction = "أنت كاتب نصوص تسويقية محترف ومختص بتهيئة محركات البحث للأجهزة والمنتجات التقنية المنزلية والعصرية. إجاباتك دائماً جذابة، غنية بالفوائد والمميزات، ومكتوبة بلغة عربية فصحى ممتازة.";
        prompt = `
        أنت خبير كاتب محتوى تسويقي وتهيئة محركات البحث (SEO Expert) لمنصة "يسرى سمايل" (Yousra Smile) المتخصصة في مراجعات الأجهزة المنزلية الذكية والمنزل العصري.
        
        المهمة: قم بإنشاء وصف تسويقي احترافي متكامل ومهيأ بالكامل للـ SEO ومقنع للشراء باللغة العربية الفصحى للمنتج التالي:
        - اسم المنتج: ${productName}
        - القسم: ${productCategory || "عام / ذكي"}
        - تفاصيل إضافية أو ميزات: ${extraDetails || "لا توجد تفاصيل إضافية"}

        يجب أن يتضمن الإخراج هيكلاً منسقاً بدقة يحتوي على العناوين والوصف والوسوم والهاشتاقات وملاحظة هامة جداً على الصورة المناسبة لهذا المنتج لجذب العملاء وتوفير تجربة تسوق غامرة.
        `;

        responseSchema = {
          type: Type.OBJECT,
          properties: {
            seoTitle: { 
              type: Type.STRING, 
              description: "عنوان مذهل ومهيأ للـ SEO وجذاب للنقر باللغة العربية (مثال: 'سعر ومراجعة مكنسة روبوروك S8: هل تستحق الشراء؟')" 
            },
            seoDescription: { 
              type: Type.STRING, 
              description: "وصف ميتا (Meta Description) احترافي ومختصر لا يتجاوز 160 حرفاً يوضح الفائدة الرئيسية." 
            },
            productDescription: { 
              type: Type.STRING, 
              description: "فقرة تسويقية افتتاحية مبهرة ومقنعة جداً للمنتج توضح كيف يحل هذا المنتج مشاكل اليومية ويسهل الحياة." 
            },
            longDescription: { 
              type: Type.STRING, 
              description: "مراجعة تفصيلية شاملة للمنتج تحتوي على المميزات الرئيسية، طريقة الاستخدام، والنصيحة الذهبية لـ 'يسرى سمايل' عند الشراء." 
            },
            tags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة من 5 وسوم تسويقية بدون رمز الهاشتاق (مثال: ['مكنسة ذكية', 'روبوروك', 'تنظيف المنزل'])." 
            },
            hashtags: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "قائمة من 5 هاشتاقات شائعة على تيك توك ويوتيوب تبدأ برمز # (مثال: ['#يسرى_سمايل', '#تنظيف', '#منزل_ذكي'])." 
            },
            keywords: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "الكلمات المفتاحية الأساسية لـ SEO للبحث عن هذا المنتج." 
            },
            imageNote: { 
              type: Type.STRING, 
              description: "ملاحظة فنية واحترافية وتوجيهية حول الصورة المصاحبة للمنتج (كيف يجب تصوير المنتج، الإضاءة، الأبعاد المناسبة، وما يجب تجنبه كالاقتصاص السيء)." 
            }
          },
          required: ["seoTitle", "seoDescription", "productDescription", "longDescription", "tags", "hashtags", "keywords", "imageNote"]
        };
      }

      // Call Gemini 3.6 Flash using the modern SDK method and strict response Schema
      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.8,
          responseMimeType: "application/json",
          responseSchema
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error("لم يرجع نموذج الذكاء الاصطناعي أي استجابة.");
      }

      const generatedData = JSON.parse(responseText.trim());
      return res.json({ success: true, data: generatedData });

    } catch (error: any) {
      console.error("AI Generation Error:", error);
      return res.status(500).json({ 
        error: error.message || "حدث خطأ غير متوقع أثناء توليد المحتوى الذكي." 
      });
    }
  });

  // Vite development middleware vs production static server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Full-Stack Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
