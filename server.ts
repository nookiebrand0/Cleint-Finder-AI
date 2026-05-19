import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to generate the outreach/client hunting plan
  app.post("/api/generate-plan", async (req, res) => {
    try {
      const { profession, service_offer, target_criteria, num_leads } = req.body;
      const numberOfLeads = num_leads ? parseInt(num_leads) : 3;

      if (!profession) {
        res.status(400).json({ error: "Profession is required" });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.status(500).json({ error: "Gemini API key is not configured on the server." });
        return;
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const contents = `I am a freelance ${profession}. What I want to do/offer: ${service_offer || "Find clients who need my services."}.
      Target criteria: ${target_criteria || "General search"}.
      
      Generate a specific plan for me to find clients based on these exact criteria. If the user asks for Instagram users with ~1000 followers, tailor everything to that. Include:
      1. targetPlatforms: Best platforms based on criteria (e.g., Instagram, YouTube).
      2. searchQueries: Exact search terms to plug into the platform search bar to find potential clients satisfying the criteria.
      3. messageTemplates: Provide 3 short, personalized, highly effective outreach message templates (Cold DM, Follow-up, Value-add). Provide them in Hinglish/Hindi or English as appropriate for a casual, effective sales process for modern internet creators.
      4. advice: 1 actionable tip.
      5. leads: Provide EXACTLY ${numberOfLeads} example target leads based on my profession, offer, and target criteria. These should be highly realistic but fictional representations. If the user asked for ~1000 followers, make the metrics around 900-1500. Include their exact platform, metrics, a realistic username without '@', the profile URL (e.g., https://instagram.com/username), and match score.
      
      Respond in JSON using the exact schema provided.`;

      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  targetPlatforms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of best platforms to find clients."
                  },
                  searchQueries: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "List of search queries to find clients."
                  },
                  messageTemplates: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        type: { type: Type.STRING, description: "Type of message (Cold DM, etc.)" },
                        content: { type: Type.STRING, description: "The actual message template content." }
                      },
                      required: ["type", "content"]
                    },
                    description: "List of message templates."
                  },
                  advice: {
                    type: Type.STRING,
                    description: "One actionable tip."
                  },
                  leads: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING, description: "Name of the lead/client" },
                        username: { type: Type.STRING, description: "Social media username without @" },
                        profileUrl: { type: Type.STRING, description: "Full URL to their profile (e.g. https://instagram.com/username)" },
                        platform: { type: Type.STRING, description: "The platform they are active on (e.g., Instagram)" },
                        metrics: { type: Type.STRING, description: "Relevant metrics (e.g., 1.2k Followers)" },
                        matchScore: { type: Type.NUMBER, description: "A simulated match percentage (0-100)" }
                      },
                      required: ["name", "username", "profileUrl", "platform", "metrics", "matchScore"]
                    },
                    description: "List of simulated example leads."
                  }
                },
                required: ["targetPlatforms", "searchQueries", "messageTemplates", "advice", "leads"]
              }
            }
          });
          break; // Success
        } catch (error: any) {
          retries--;
          if (retries === 0 || error?.status !== 503) {
            throw error;
          }
           await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }

      let responseText = response?.text;
      if (!responseText) {
          throw new Error("No response from AI model.");
      }
      
      const jsonResponse = JSON.parse(responseText);

      res.json(jsonResponse);
    } catch (error: any) {
      console.error("Error generating plan:", error);
      
      // Fallback response for demo purposes if API fails
      if (error?.status === 429 || error?.status === 503 || error.message.includes("quota") || error.message.includes("high demand")) {
        console.log("Using fallback mock data due to API limits.");
        return res.json({
          targetPlatforms: ["Instagram Explore (Hashtags)", "Instagram Reels Comments", "YouTube Creator Accounts"],
          searchQueries: ["#videoeditorwanted", "#needavideoeditor", "looking for video editor"],
          messageTemplates: [
            { type: "Cold DM", content: "Hey! Loved your recent reel about [Topic]. Noticed the edits could be a bit punchier to boost retention. I'm a video editor and took the liberty of editing your last video as a sample. Mind if I send it over?" },
            { type: "Follow-up", content: "Hey [Name], just bumping this up! Did you get a chance to see that sample edit I sent? Would love to hear your thoughts." },
            { type: "Value-add", content: "Quick tip: adding dynamic captions in the first 3 seconds can boost your hook retention by 20%. Let me know if you need help setting that up!" }
          ],
          advice: "Focus on smaller creators (1k-5k) first. They are more accessible and often willing to pay for quality to grow.",
          leads: [
            { name: "Tech Creator 1", username: "tech_guru_99", profileUrl: "https://instagram.com/tech_guru_99", platform: "Instagram", metrics: "1.2k Followers", matchScore: 92 },
            { name: "Fitness Coach", username: "fit_coach_alex", profileUrl: "https://instagram.com/fit_coach_alex", platform: "Instagram", metrics: "1.5k Followers", matchScore: 88 },
            { name: "Finance Tips", username: "money_matters_now", profileUrl: "https://instagram.com/money_matters_now", platform: "Instagram", metrics: "950 Followers", matchScore: 85 }
          ]
        });
      }

      res.status(500).json({ error: error.message || "Failed to generate plan." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
