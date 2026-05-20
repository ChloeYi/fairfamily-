import { db } from "./firebase";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";

const DEMO_CHILDREN = [
  {
    name: "Emma",
    age: 10,
    emoji: "🌸",
    color: "#FF6B6B",
    totalSpent: 1240,
    giftCount: 8,
    experienceCount: 5,
    milestoneCount: 3,
    logs: [
      { type: "gift", desc: "Birthday bike", amount: 320, age: 7 },
      { type: "experience", desc: "Disneyland trip", amount: 450, age: 8 },
      { type: "milestone", desc: "First school play", amount: 0, age: 9 },
    ],
  },
  {
    name: "Liam",
    age: 7,
    emoji: "⚡",
    color: "#4ECDC4",
    totalSpent: 680,
    giftCount: 4,
    experienceCount: 3,
    milestoneCount: 2,
    logs: [
      { type: "gift", desc: "LEGO set", amount: 120, age: 6 },
      { type: "experience", desc: "Zoo visit", amount: 80, age: 7 },
      { type: "milestone", desc: "Lost first tooth", amount: 0, age: 6 },
    ],
  },
  {
    name: "Zoe",
    age: 7,
    emoji: "🌻",
    color: "#EC4899",
    totalSpent: 520,
    giftCount: 3,
    experienceCount: 2,
    milestoneCount: 1,
    logs: [
      { type: "gift", desc: "Art supplies", amount: 95, age: 7 },
      { type: "experience", desc: "School performance", amount: 0, age: 7 },
      { type: "milestone", desc: "Started reading chapter books", amount: 0, age: 6 },
    ],
  },
];

export async function seedMarketingData() {
  try {
    for (const child of DEMO_CHILDREN) {
      const { logs, ...childData } = child;

      const childRef = doc(collection(db, "marketing", "demo", "children"));
      await setDoc(childRef, {
        ...childData,
        createdAt: serverTimestamp(),
      });

      for (const log of logs) {
        await addDoc(collection(db, "marketing", "demo", "children", childRef.id, "logs"), {
          ...log,
          createdAt: serverTimestamp(),
        });
      }
    }
    console.log("✅ Marketing demo data saved to Firestore: marketing/demo/children");
  } catch (e) {
    console.error("❌ Failed to seed marketing data:", e);
  }
}
