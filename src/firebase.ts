import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test Connection
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration or network.");
    }
  }
}
testConnection();

// Initial premium fossil specimens to populate the museum if the database is empty or offline
export const PRELOADED_EXHIBITS = [
  {
    id: "fossil-ammonite",
    fossilName: "Amonite Gigante (Ancyloceras)",
    groupName: "Curadoria do Museu",
    geologicEra: "Mesozoico",
    age: "115 milhões de anos (Cretáceo)",
    location: "Svalbard, Noruega",
    description: "Este magnífico espécime exibe a concha em espiral característica dos amonites, moluscos cefalópodes marinhos extintos. A concha servia tanto de proteção como de controlo de flutuabilidade na coluna de água. As estrias e costelas preservadas indicam uma excelente fossilização em ambiente marinho de águas calmas e profundas.",
    fossilType: "AMMONITE",
    color: "#a38d75",
    wearFactor: 0.15,
    size: 1.2,
    ridges: 24,
    scientificFacts: [
      "Os amonites são parentes distantes do polvo e lula modernos, mas possuíam uma concha rígida externa.",
      "Eram animais nectónicos carnívoros que capturavam presas com tentáculos.",
      "A sua rápida evolução e ampla distribuição tornam-nos excelentes fósseis de idade ou fósseis guia.",
      "A extinção dos amonites ocorreu em simultâneo com a dos dinossauros há 66 milhões de anos."
    ],
    fossilizationProcess: [
      "Morte do amonite e deposição do corpo macio e da concha carbonatada no fundo lodoso do oceano.",
      "Rápida deposição de sedimentos finos (silte e argila) que isolaram a concha do oxigénio, travando a decomposição.",
      "Diagénese: mineralização gradual onde a água rica em minerais infiltrou as câmaras vazias da concha.",
      "Substituição de calcite e aragonite por minerais de ferro e sílica ao longo de milhões de anos.",
      "Erosão natural e levantamento tectónico que expuseram o fóssil à superfície nas falésias árticas."
    ],
    curiosities: [
      "O termo 'Amonite' deriva do deus egípcio Amon, que era frequentemente representado com cornos de carneiro em espiral.",
      "Alguns espécimes de amonite polidos revelam iridescência colorida (Amolite), brilhando em tons de verde, vermelho e dourado.",
      "As linhas de sutura na concha tornavam-se progressivamente mais complexas à medida que a espécie evoluía, melhorando a resistência à pressão."
    ],
    quizQuestions: [
      {
        question: "A que classe de animais pertenciam os amonites?",
        options: ["Répteis Marinhos", "Cefalópodes (Moluscos)", "Peixes Cartilagíneos", "Crustáceos"],
        answerIndex: 1,
        explanation: "Os amonites eram moluscos cefalópodes marinhos, tal como o náutilo, choco e polvo modernos."
      },
      {
        question: "Qual era a principal função das câmaras internas da concha do amonite?",
        options: ["Armazenar comida para o inverno", "Regular a flutuabilidade na água", "Incubar os ovos", "Combater parasitas"],
        answerIndex: 1,
        explanation: "O amonite controlava a quantidade de gás e líquido nas câmaras através de um órgão tubular (sifúnculo) para subir ou descer na coluna de água."
      }
    ],
    likesCount: 34,
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: "fossil-trilobite",
    fossilName: "Trilobite (Elrathia kingii)",
    groupName: "Grupo Científico do Paleolítico",
    geologicEra: "Paleozoico",
    age: "505 milhões de anos (Câmbrico)",
    location: "Utah, Estados Unidos",
    description: "Um dos fósseis de trilobite mais clássicos e perfeitamente preservados. As trilobites foram artrópodes marinhos primitivos que dominaram os mares durante mais de 250 milhões de anos. Este espécime demonstra a divisão tripartida nítida do corpo em lobo esquerdo, lobo central (axial) e lobo direito, além dos olhos compostos fossilizados.",
    fossilType: "TRILOBITE",
    color: "#544e45",
    wearFactor: 0.3,
    size: 1.0,
    ridges: 14,
    scientificFacts: [
      "Foram os primeiros animais conhecidos a desenvolver olhos complexos compostos de lentes de calcite pura.",
      "Pertencem ao filo dos artrópodes, partilhando parentesco com as caranguejos-ferradura atuais.",
      "Existiram mais de 20.000 espécies descritas de trilobites, adaptadas a quase todos os nichos ecológicos marinhos.",
      "A sua extinção definitiva ocorreu na grande extinção do Pérmico-Triássico, o maior cataclismo da história da Terra."
    ],
    fossilizationProcess: [
      "O artrópode sofreu a muda do seu exosqueleto de quitina impregnado de calcite, ou morreu no fundo do mar.",
      "O corpo foi soterrado rapidamente por uma tempestade de areia e lama marinha fina.",
      "A matéria mole decompôs-se, deixando a armadura exterior de calcite protegida das correntes.",
      "A compressão geológica ao longo de centenas de milhões de anos transformou o sedimento em xisto fóssil.",
      "O exosqueleto mineralizado manteve os mínimos detalhes estruturais, incluindo facetas oculares microscópicas."
    ],
    curiosities: [
      "Para se defenderem de predadores gigantes como o Anomalocaris, muitas espécies de trilobites podiam enrolar-se como 'bichos-de-conta' modernos.",
      "Algumas trilobites tinham espinhos gigantescos com o comprimento de várias vezes o seu corpo, usados para flutuar ou defesa.",
      "Os nativos americanos da tribo Ute usavam fósseis de trilobites como amuletos de proteção chamados 'pequenos insetos de pedra'."
    ],
    quizQuestions: [
      {
        question: "Donde provém o nome 'Trilobite'?",
        options: [
          "Do facto de terem vivido em três oceanos diferentes",
          "Dos três lobos longitudinais que dividem o seu corpo",
          "Das três patas articuladas principais",
          "Da sua dieta composta por três tipos de algas"
        ],
        answerIndex: 1,
        explanation: "O nome Trilobite significa 'três lobos', referindo-se à divisão do seu exosqueleto em lobo pleural esquerdo, lobo axial médio e lobo pleural direito."
      },
      {
        question: "De que material eram feitas as lentes oculares das trilobites?",
        options: ["Vidro vulcânico", "Água salgada congelada", "Calcite (Mineral cristalino)", "Quitina pura e flexível"],
        answerIndex: 2,
        explanation: "As trilobites usavam cristais de calcite pura (carbonato de cálcio) para formar lentes oculares rígidas e perfeitamente focadas na água do mar."
      }
    ],
    likesCount: 28,
    createdBy: "system",
    createdAt: new Date().toISOString()
  },
  {
    id: "fossil-megalodon",
    fossilName: "Dente de Megalodonte",
    groupName: "Paleodetectives do Cenozoico",
    geologicEra: "Cenozoico",
    age: "15 milhões de anos (Mioceno)",
    location: "Carolina do Sul, Estados Unidos",
    description: "Este dente gigantesco e triangular pertenceu ao Otodus megalodon, o maior tubarão que já cruzou os oceanos do nosso planeta. Medindo mais de 12 centímetros de altura diagonal, este fóssil apresenta uma serrilha de corte perfeitamente preservada ao longo dos flancos e uma raiz espessa e robusta, indicando que provinha de um predador no topo da cadeia alimentar marinha.",
    fossilType: "MEGALODON_TOOTH",
    color: "#2d2a26",
    wearFactor: 0.1,
    size: 1.5,
    ridges: 32,
    scientificFacts: [
      "O Megalodonte podia atingir entre 15 a 18 metros de comprimento, três vezes maior que o Grande Tubarão Branco atual.",
      "Sendo peixes cartilagíneos, o seu esqueleto raramente fossilizava, pelo que os dentes são a nossa principal fonte de estudo.",
      "Estima-se que a sua força de mordida era de cerca de 180.000 Newtons, capaz de esmagar o crânio de uma baleia pré-histórica.",
      "A sua dieta consistia principalmente em baleias místicas, golfinhos gigantes e tartarugas marinhas de grande porte."
    ],
    fossilizationProcess: [
      "O tubarão perdeu o dente de forma natural durante uma caçada (um tubarão perde milhares de dentes durante a sua vida).",
      "O dente assentou rapidamente em sedimentos marinhos costeiros ricos em fosfato.",
      "Substituição química: os minerais de fosfato e ferro na água dos poros substituíram gradualmente a dentina e o esmalte originais.",
      "A cor escura típica (cinzento/preto) deve-se à absorção de óxidos de ferro e manganês dos sedimentos circundantes.",
      "Dragagens fluviais e marés expuseram o dente intacto no leito de um rio costeiro."
    ],
    curiosities: [
      "Na Idade Média, as pessoas acreditavam que os dentes de Megalodonte eram línguas petrificadas de dragões ou serpentes míticas, chamadas 'Glossópetras'.",
      "Os dentes de Megalodonte podiam atingir até 18 centímetros de altura vertical — o tamanho de uma mão humana aberta!",
      "A extinção do Megalodonte há 3.6 milhões de anos coincidiu com um arrefecimento global e a ascensão das baleias assassinas (Orcas)."
    ],
    quizQuestions: [
      {
        question: "Por que motivo os dentes são quase os únicos fósseis que encontramos de Megalodonte?",
        options: [
          "Porque os dinossauros comeram o resto do corpo",
          "Porque o resto do esqueleto era feito de cartilagem flexível que se decompõe facilmente",
          "Porque os tubarões escondiam os dentes na areia",
          "Porque os dentes eram a única parte blindada de metal"
        ],
        answerIndex: 1,
        explanation: "Os tubarões são peixes cartilagíneos. A cartilagem é muito mais mole que o osso e raramente sobrevive ao soterramento e fossilização, ao contrário dos dentes altamente mineralizados."
      }
    ],
    likesCount: 52,
    createdBy: "system",
    createdAt: new Date().toISOString()
  }
];
