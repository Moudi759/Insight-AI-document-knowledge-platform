/**
 * Insight database seed.
 *
 * Creates a demo user (demo@insight.app / demo1234) with a populated,
 * realistic workspace: documents with real extracted text, embeddings,
 * collections, conversations and activity history.
 *
 * Run: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { promises as fs } from "fs";
import path from "path";
import {
  chunkText,
  estimateTokens,
} from "../src/lib/server/documents/chunking";
import { generateEmbeddings } from "../src/lib/server/ai/embeddings";

const db = new PrismaClient();

const DEMO_EMAIL = "demo@insight.app";
const DEMO_PASSWORD = "demo1234";

// ── Sample documents ─────────────────────────────────────────

const SAMPLE_DOCS: {
  title: string;
  fileName: string;
  fileType: "MD" | "TXT" | "PDF";
  collection: string;
  daysAgo: number;
  sizeMb: number;
  text: string;
}[] = [
  {
    title: "Quantum Computing — State of the Field",
    fileName: "quantum-computing-review.md",
    fileType: "MD",
    collection: "Research",
    daysAgo: 12,
    sizeMb: 0.8,
    text: `# Quantum Computing — State of the Field

## Abstract
This review summarizes the main findings of quantum computing research between 2024 and 2026, focusing on error correction, hardware scaling, and practical algorithms.

## Error Correction
The most significant recent finding is that logical qubit error rates can be suppressed exponentially by increasing code distance. Surface codes demonstrated error correction below the fault-tolerance threshold, with logical error rates of 10^-6 per cycle achieved on superconducting hardware.

## Hardware Approaches
Superconducting transmon qubits remain the most scaled platform with over 1000 physical qubits. Trapped-ion systems lead in two-qubit gate fidelity at 99.97%. Neutral atoms emerged as a strong contender combining scalability with reconfigurable connectivity through optical tweezers.

## Algorithms
Shor's algorithm and Grover search remain foundational, but the near-term focus shifted to variational quantum algorithms and quantum simulation of materials. The main finding for chemistry simulation is that fault-tolerant simulation of industrially relevant molecules requires roughly one million logical qubits.

## Key Numbers
- Physical error rate threshold for surface codes: approximately 1%
- Demonstrated logical qubit counts: up to 48 logical qubits
- Quantum advantage claimed in random circuit sampling and boson sampling experiments

## Conclusion
Error-corrected quantum computing moved from theory to engineering reality. Practical advantage in chemistry and optimization is projected within the decade, contingent on reducing physical error rates below 10^-4.`,
  },
  {
    title: "Neural Networks Lecture Notes",
    fileName: "neural-networks-notes.md",
    fileType: "MD",
    collection: "University",
    daysAgo: 5,
    sizeMb: 0.5,
    text: `# Neural Networks — Lecture Notes

## Perceptron
The perceptron is the simplest neural unit: it computes a weighted sum of inputs plus a bias, then applies a step activation function. The perceptron learning rule updates weights only on misclassified examples. Important dates: Rosenblatt introduced the perceptron in 1958.

## Multilayer Perceptrons
A single layer cannot solve XOR. Stacking layers with nonlinear activations solves this. Universal approximation theorem: a network with one hidden layer and enough neurons can approximate any continuous function on a compact domain.

## Backpropagation
Backpropagation computes gradients of the loss with respect to every weight using the chain rule, propagating error signals backwards. Gradient descent updates weights in the direction that reduces loss. Learning rate controls step size; too large causes divergence, too small causes slow convergence.

## Activation Functions
ReLU is the default choice for hidden layers because it avoids vanishing gradients. Softmax converts logits into probabilities for classification output layers.

## Training Tips
Normalize inputs to zero mean. Initialize weights with He or Xavier initialization. Monitor validation loss to detect overfitting early. Dropout randomly deactivates neurons during training as regularization.`,
  },
  {
    title: "Project Aurora — Product Requirements",
    fileName: "aurora-prd.txt",
    fileType: "TXT",
    collection: "Projects",
    daysAgo: 20,
    sizeMb: 0.3,
    text: `PROJECT AURORA — PRODUCT REQUIREMENTS DOCUMENT

OVERVIEW
Aurora is a collaborative whiteboard for distributed product teams. This document defines scope, success metrics and constraints.

GOALS
Launch a public beta by Q2. Reach 500 weekly active teams within three months of launch. Achieve a median canvas load time under 800 milliseconds.

CORE FEATURES
Real-time multiplayer editing with conflict-free replicated data types. Infinite canvas with zoom levels from 10% to 800%. Shape, connector and sticky-note tooling. Comment threads anchored to objects. Export to PNG, SVG and PDF.

NON-GOALS
Native mobile apps are out of scope for beta. Offline editing ships after general availability.

CONSTRAINTS
Budget capped at two engineers and one designer until Series A. Infrastructure must run entirely on managed services. Latency budget for sync operations is 120 milliseconds round trip.

SUCCESS METRICS
Activation defined as creating a board and inviting a teammate within the first session, target 40%. Weekly retention target 35%. Net promoter score above 45.

RISKS
Largest technical risk is synchronization complexity under poor network conditions. Mitigation: extensive chaos testing before beta.`,
  },
  {
    title: "TypeScript Patterns Cheat Sheet",
    fileName: "typescript-patterns.md",
    fileType: "MD",
    collection: "Programming",
    daysAgo: 8,
    sizeMb: 0.4,
    text: `# TypeScript Patterns Cheat Sheet

## Discriminated Unions
Model states explicitly with a tag field. A Result type with kind: "success" | "error" lets the compiler narrow control flow and eliminate impossible states.

## Type Guards
User-defined type guards are functions returning value is Type. They centralize runtime validation and keep call sites clean.

## Generics with Constraints
Extend generics with extends clauses to require capabilities while staying reusable. Generic helper functions should take the narrowest input type possible.

## Utility Types
Partial, Pick, Omit and ReturnType cover most transformation needs. Prefer deriving types from data shapes rather than declaring parallel interfaces.

## Branded Types
Brand primitive ids (UserId, DocumentId) with an intersection type to prevent mixing them up at compile time. This costs nothing at runtime.

## Strict Mode Rules
Enable noUncheckedIndexedAccess to catch undefined from array access. Avoid non-null assertions. Treat any as a code smell requiring justification in review.`,
  },
  {
    title: "Reading List — Systems Design",
    fileName: "systems-design-list.txt",
    fileType: "TXT",
    collection: "Personal",
    daysAgo: 30,
    sizeMb: 0.2,
    text: `SYSTEMS DESIGN READING LIST

Papers
Dynamo (2007) — eventually consistent key-value store at Amazon.
Kafka (2011) — distributed log for event streaming.
Spanner (2012) — globally consistent distributed database with TrueTime.
Raft (2014) — understandable consensus algorithm.

Books
Designing Data-Intensive Applications by Martin Kleppmann covers storage engines, replication, partitioning and consistency models.
Site Reliability Engineering by Google covers service level objectives and error budgets.

Key concepts to internalize
CAP theorem and its practical nuances. Consistent hashing for horizontal scaling. Write-ahead logs for durability. Idempotency for safe retries.`,
  },
  {
    title: "Market Research — Knowledge Tools",
    fileName: "market-research-knowledge-tools.md",
    fileType: "MD",
    collection: "Research",
    daysAgo: 15,
    sizeMb: 0.6,
    text: `# Market Research — AI Knowledge Tools

## Summary of Findings
The personal knowledge management market reached $2.1 billion in annual recurring revenue, growing 28% year over year. AI-native tools capture the fastest-growing segment.

## User Segments
Students represent 34% of users and prioritize affordability. Developers are 22% and value keyboard-first UX and local storage. Researchers are 14% and demand citation accuracy above all else.

## Willingness to Pay
Median willingness to pay is $10 per month for individuals and $25 per seat for teams. Annual billing increases conversion by 19%.

## Competitive Landscape
Established note apps added AI features but suffer legacy architecture. New entrants differentiate on retrieval quality rather than generation quality.

## Recommendations
Lead with citation-grounded answers, since trust drives retention in this category. Offer a generous free tier to build library lock-in.`,
  },
];

const COLLECTIONS = [
  { name: "University", color: "#6366f1", description: "Courses, lectures and study material" },
  { name: "Research", color: "#8b5cf6", description: "Papers and market analysis" },
  { name: "Programming", color: "#06b6d4", description: "Reference notes and patterns" },
  { name: "Projects", color: "#f59e0b", description: "Active project documents" },
  { name: "Personal", color: "#ec4899", description: "Reading lists and everything else" },
];

async function main() {
  console.log("Seeding Insight database…");

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

  // ── Demo user ──
  const user = await db.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: {
      name: "Demo User",
      email: DEMO_EMAIL,
      passwordHash,
    },
  });

  await db.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id },
  });

  // Clean slate for repeatable seeds.
  await db.activityEvent.deleteMany({ where: { userId: user.id } });
  await db.collection.deleteMany({ where: { userId: user.id } });
  await db.conversation.deleteMany({ where: { userId: user.id } });
  const existingDocs = await db.document.findMany({
    where: { userId: user.id },
    select: { id: true },
  });
  await db.document.deleteMany({ where: { userId: user.id } });
  for (const doc of existingDocs) {
    await fs.rm(path.join(process.cwd(), ".storage", user.id, `${doc.id}`), {
      force: true,
    }).catch(() => undefined);
  }

  // ── Collections ──
  const collectionIds = new Map<string, string>();
  for (const collection of COLLECTIONS) {
    const created = await db.collection.create({
      data: {
        userId: user.id,
        ...collection,
      },
      select: { id: true, name: true },
    });
    collectionIds.set(created.name, created.id);
  }

  // ── Documents ──
  const readyDocIds: string[] = [];

  for (const [index, sample] of SAMPLE_DOCS.entries()) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - sample.daysAgo);

    const wordCount = sample.text.split(/\s+/).filter(Boolean).length;

    const document = await db.document.create({
      data: {
        userId: user.id,
        title: sample.title,
        fileName: sample.fileName,
        fileType: sample.fileType,
        fileSize: Buffer.byteLength(sample.text),
        storageKey: "", // filled below
        extractedText: sample.text,
        wordCount,
        processingStatus: "PROCESSING",
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });

    // Persist the raw file so viewer + download work out of the box.
    const extension = sample.fileType === "MD" ? ".md" : ".txt";
    const storageKey = path.posix.join(user.id, `${document.id}${extension}`);
    const absolute = path.join(process.cwd(), ".storage", storageKey);
    await fs.mkdir(path.dirname(absolute), { recursive: true });
    await fs.writeFile(absolute, sample.text);

    await db.document.update({
      where: { id: document.id },
      data: { storageKey },
    });

    // Chunk + embed so chat works immediately in demo mode.
    const chunks = chunkText(sample.text);
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddings(chunks.map((chunk) => chunk.content));
    } catch (error) {
      console.warn(`Embedding failed for "${sample.title}" — storing without vectors.`);
    }

    for (const chunk of chunks) {
      await db.documentChunk.create({
        data: {
          documentId: document.id,
          chunkIndex: chunk.index,
          content: chunk.content,
          embedding: embeddings[chunk.index] ?? undefined,
          tokenCount: estimateTokens(chunk.content),
        },
      });
    }

    await db.document.update({
      where: { id: document.id },
      data: { processingStatus: "READY" },
    });

    if (sample.collection) {
      const collectionId = collectionIds.get(sample.collection);
      if (collectionId) {
        await db.collectionDocument.create({
          data: { collectionId, documentId: document.id },
        }).catch(() => undefined);
      }
    }

    readyDocIds.push(document.id);
    console.log(
      `  ✓ ${sample.title} (${chunks.length} chunks${embeddings.length ? ", embedded" : ""})`
    );

    await db.activityEvent.create({
      data: {
        userId: user.id,
        type: "document.ready",
        message: `"${sample.title}" finished processing`,
        metadata: { documentId: document.id },
        createdAt,
      },
    });

    index;
  }

  // Mark one document as failed to exercise the failure UI.
  const failedTitle = "Corrupted Scan.pdf";
  await db.document.create({
    data: {
      userId: user.id,
      title: failedTitle,
      fileName: "corrupted-scan.pdf",
      fileType: "PDF",
      fileSize: 48_231,
      storageKey: `unavailable/corrupted-scan.pdf`,
      processingStatus: "FAILED",
      errorMessage: "No readable text found in this PDF. It may be a scanned document.",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  });

  // ── Conversations ──
  const quantumDocId = readyDocIds[0];
  const auroraDocId = readyDocIds[2];
  if (!quantumDocId || !auroraDocId) throw new Error("Seed docs missing");

  const conversationsSpec: {
    documentId: string | null;
    title: string;
    daysAgo: number;
    turns: { role: "USER" | "ASSISTANT"; content: string }[];
  }[] = [
    {
      documentId: quantumDocId,
      title: "What are the main findings?",
      daysAgo: 11,
      turns: [
        {
          role: "USER",
          content: "What are the main findings of this document?",
        },
        {
          role: "ASSISTANT",
          content: `Here is what **Quantum Computing — State of the Field** identifies as its main findings:\n\n- Logical qubit error rates can be suppressed exponentially by increasing surface-code distance [Source 1]\n- Superconducting platforms lead in scale with 1000+ physical qubits, while trapped ions lead in gate fidelity at 99.97% [Source 1]\n- Fault-tolerant chemistry simulations of industrial molecules need roughly one million logical qubits [Source 1]\n\nAsk a follow-up if you want details on any point.`,
        },
      ],
    },
    {
      documentId: auroraDocId,
      title: "Success metrics for Aurora beta",
      daysAgo: 6,
      turns: [
        {
          role: "USER",
          content: "Which metrics define success for the beta launch?",
        },
        {
          role: "ASSISTANT",
          content: `According to **Project Aurora — Product Requirements**, beta success is measured by:\n\n- Activation: creating a board and inviting a teammate in the first session — target 40% [Source 1]\n- Weekly retention target of 35% [Source 1]\n- Net promoter score above 45 [Source 1]`,
        },
      ],
    },
    {
      documentId: null,
      title: "Compare error thresholds across sources",
      daysAgo: 2,
      turns: [
        {
          role: "USER",
          content: "What do my documents say about error thresholds?",
        },
        {
          role: "ASSISTANT",
          content: `Your library mentions error thresholds in two places:\n\n- Quantum computing: the surface-code threshold sits around 1% physical error rate, with practical targets below 10^-4 [Source 1]\n- Neural network training: high learning rates cause divergence, low rates slow convergence [Source 2]\n\nWant me to go deeper on either?`,
        },
      ],
    },
  ];

  for (const spec of conversationsSpec) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - spec.daysAgo);

    const conversation = await db.conversation.create({
      data: {
        userId: user.id,
        documentId: spec.documentId,
        title: spec.title,
        createdAt,
        updatedAt: createdAt,
      },
      select: { id: true },
    });

    let turnOffset = 0;
    for (const turn of spec.turns) {
      const at = new Date(createdAt.getTime() + turnOffset * 45_000);
      await db.message.create({
        data: {
          conversationId: conversation.id,
          role: turn.role,
          content: turn.content,
          sources:
            turn.role === "ASSISTANT"
              ? [
                  {
                    documentId: spec.documentId ?? quantumDocId,
                    documentTitle:
                      SAMPLE_DOCS.find((d) => d.collection)?.title ??
                      "Document",
                    chunkIndex: 0,
                    page: null,
                    snippet: "Relevant passage cited from your library.",
                  },
                ]
              : undefined,
          createdAt: at,
        },
      });
      turnOffset += 1;
    }
  }

  await db.activityEvent.create({
    data: {
      userId: user.id,
      type: "chat.created",
      message: `Asked ${conversationsSpec.length} conversations worth of questions across your library`,
    },
  });

  console.log("\nSeed complete!");
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
