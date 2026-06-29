import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// AI Curation Assistant Endpoint
app.post('/api/curate', async (req, res) => {
  const { fossilName } = req.body;

  if (!fossilName || typeof fossilName !== 'string' || fossilName.trim().length < 2) {
    return res.status(400).json({ error: 'Nome do fóssil inválido ou ausente.' });
  }

  try {
    const prompt = `Gera um conteúdo científico detalhado e interativo para a ficha de um fóssil chamado "${fossilName}" em língua portuguesa (Portugal). Configura as propriedades 3D procedimentais de forma a aproximar o espécime ao seu aspeto real.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'És um paleontólogo sénior e curador de museus nacionais especializado em fósseis e geologia. Fornece informações estritamente fidedignas e cientificamente exatas em português de Portugal. Escolhe com rigor geocientífico o tipo de fósseis procedimental adequado entre as seguintes categorias: AMMONITE, TRILOBITE, MEGALODON_TOOTH, LEAF_IMPRINT, AMBER_INSECT, DINOSAUR_BONE.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            fossilName: { type: Type.STRING, description: "Nome científico ou comum corrigido do fóssil (ex: 'Braquiópode', 'Pterodáctilo')" },
            geologicEra: { type: Type.STRING, description: "Must be exactly 'Paleozoico', 'Mesozoico' or 'Cenozoico'" },
            age: { type: Type.STRING, description: "Idade estimada detalhada (ex: '150 milhões de anos (Jurássico Superior)')" },
            location: { type: Type.STRING, description: "Principal localidade, jazida geológica ou país onde é encontrado" },
            description: { type: Type.STRING, description: "Descrição científica e ecológica sumária detalhada, em português de Portugal, com 3 a 5 frases" },
            fossilType: { 
              type: Type.STRING, 
              description: "Must be exactly one of: 'AMMONITE', 'TRILOBITE', 'MEGALODON_TOOTH', 'LEAF_IMPRINT', 'AMBER_INSECT', 'DINOSAUR_BONE'" 
            },
            color: { type: Type.STRING, description: "Código de cor hexadecimal realista para o material de pedra do fóssil (ex: '#9c8c7c' ou '#4d463e')" },
            scientificFacts: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de exatamente 4 factos científicos de alto valor pedagógico sobre a espécie"
            },
            fossilizationProcess: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de exatamente 5 etapas cronológicas do processo de preservação fóssil, em português"
            },
            curiosities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Lista de exatamente 3 curiosidades intrigantes e divertidas para cativar visitantes"
            },
            quizQuestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING, description: "Pergunta de escolha múltipla intrigante sobre o fóssil" },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Exatamente 4 opções de resposta, com apenas uma correta"
                  },
                  answerIndex: { type: Type.INTEGER, description: "Índice da opção correta (0, 1, 2 ou 3)" },
                  explanation: { type: Type.STRING, description: "Explicação científica pormenorizada de porque é que essa resposta está correta" }
                },
                required: ["question", "options", "answerIndex", "explanation"]
              },
              description: "Exatamente 2 perguntas interativas para o quiz do fóssil"
            }
          },
          required: [
            "fossilName",
            "geologicEra",
            "age",
            "location",
            "description",
            "fossilType",
            "color",
            "scientificFacts",
            "fossilizationProcess",
            "curiosities",
            "quizQuestions"
          ]
        }
      }
    });

    const jsonText = response.text?.trim() || '{}';
    const parsedData = JSON.parse(jsonText);

    res.json(parsedData);
  } catch (error) {
    console.error('Erro na curadoria IA:', error);
    res.status(500).json({ error: 'Erro ao gerar curadoria científica via IA. Tente preencher manualmente ou tente novamente.' });
  }
});

// Vite Integration & Static Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware mounted in Development mode');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static files from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
