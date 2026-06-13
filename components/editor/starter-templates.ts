import { CanvasNode, CanvasEdge } from "@/types/canvas";

export interface CanvasTemplate {
  id: string;
  name: string;
  description: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export const CANVAS_TEMPLATES: CanvasTemplate[] = [
  {
    id: "microservices",
    name: "Microservices",
    description: "API Gateway routes traffic to isolated services, each backed by a dedicated database and connected via a shared message bus.",
    nodes: [
      {
        id: "client",
        type: "canvasNode",
        position: { x: 50, y: 160 },
        width: 120,
        height: 50,
        style: { width: 120, height: 50 },
        data: { label: "Web Client", shape: "pill", color: "#10233D" }, // Blue
      },
      {
        id: "gateway",
        type: "canvasNode",
        position: { x: 250, y: 160 },
        width: 120,
        height: 50,
        style: { width: 120, height: 50 },
        data: { label: "API Gateway", shape: "rectangle", color: "#062822" }, // Teal
      },
      {
        id: "broker",
        type: "canvasNode",
        position: { x: 250, y: 260 },
        width: 120,
        height: 90,
        style: { width: 120, height: 90 },
        data: { label: "Message Bus", shape: "hexagon", color: "#2E1938" }, // Purple
      },
      {
        id: "service-1",
        type: "canvasNode",
        position: { x: 450, y: 40 },
        width: 130,
        height: 50,
        style: { width: 130, height: 50 },
        data: { label: "Auth Service", shape: "rectangle", color: "#2E1938" }, // Purple
      },
      {
        id: "service-2",
        type: "canvasNode",
        position: { x: 450, y: 120 },
        width: 130,
        height: 50,
        style: { width: 130, height: 50 },
        data: { label: "User Service", shape: "rectangle", color: "#2E1938" }, // Purple
      },
      {
        id: "service-3",
        type: "canvasNode",
        position: { x: 450, y: 200 },
        width: 130,
        height: 50,
        style: { width: 130, height: 50 },
        data: { label: "Order Service", shape: "rectangle", color: "#2E1938" }, // Purple
      },
      {
        id: "service-4",
        type: "canvasNode",
        position: { x: 450, y: 280 },
        width: 130,
        height: 50,
        style: { width: 130, height: 50 },
        data: { label: "Payment Service", shape: "rectangle", color: "#2E1938" }, // Purple
      },
      {
        id: "db-1",
        type: "canvasNode",
        position: { x: 670, y: 40 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Auth DB", shape: "rectangle", color: "#1F1F1F" },
      },
      {
        id: "db-2",
        type: "canvasNode",
        position: { x: 670, y: 120 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "User DB", shape: "rectangle", color: "#1F1F1F" },
      },
      {
        id: "db-3",
        type: "canvasNode",
        position: { x: 670, y: 200 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Order DB", shape: "rectangle", color: "#1F1F1F" },
      },
      {
        id: "db-4",
        type: "canvasNode",
        position: { x: 670, y: 280 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Payment DB", shape: "rectangle", color: "#1F1F1F" },
      },
    ],
    edges: [
      { id: "e1", type: "canvasEdge", source: "client", target: "gateway", sourceHandle: "right", targetHandle: "left" },
      { id: "e2", type: "canvasEdge", source: "gateway", target: "service-1", sourceHandle: "right", targetHandle: "left" },
      { id: "e3", type: "canvasEdge", source: "gateway", target: "service-2", sourceHandle: "right", targetHandle: "left" },
      { id: "e4", type: "canvasEdge", source: "gateway", target: "service-3", sourceHandle: "right", targetHandle: "left" },
      { id: "e5", type: "canvasEdge", source: "broker", target: "service-3", sourceHandle: "right", targetHandle: "left" },
      { id: "e6", type: "canvasEdge", source: "broker", target: "service-4", sourceHandle: "right", targetHandle: "left" },
      { id: "e7", type: "canvasEdge", source: "service-1", target: "db-1", sourceHandle: "right", targetHandle: "left" },
      { id: "e8", type: "canvasEdge", source: "service-2", target: "db-2", sourceHandle: "right", targetHandle: "left" },
      { id: "e9", type: "canvasEdge", source: "service-3", target: "db-3", sourceHandle: "right", targetHandle: "left" },
      { id: "e10", type: "canvasEdge", source: "service-4", target: "db-4", sourceHandle: "right", targetHandle: "left" },
    ],
  },
  {
    id: "cicd-pipeline",
    name: "CI/CD Pipeline",
    description: "End-to-end delivery from source commit through build, test, containerisation, and staged deployment to production.",
    nodes: [
      {
        id: "source",
        type: "canvasNode",
        position: { x: 50, y: 100 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Source", shape: "rectangle", color: "#10233D" }, // Blue
      },
      {
        id: "build",
        type: "canvasNode",
        position: { x: 190, y: 100 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Build", shape: "rectangle", color: "#062822" }, // Teal
      },
      {
        id: "test",
        type: "canvasNode",
        position: { x: 330, y: 100 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Test", shape: "rectangle", color: "#2E1938" }, // Purple
      },
      {
        id: "package",
        type: "canvasNode",
        position: { x: 470, y: 100 },
        width: 100,
        height: 50,
        style: { width: 100, height: 50 },
        data: { label: "Package", shape: "rectangle", color: "#331B00" }, // Orange
      },
      {
        id: "approve",
        type: "canvasNode",
        position: { x: 610, y: 80 },
        width: 90,
        height: 90,
        style: { width: 90, height: 90 },
        data: { label: "Approve", shape: "diamond", color: "#3C1618" }, // Red
      },
      {
        id: "deploy",
        type: "canvasNode",
        position: { x: 740, y: 100 },
        width: 110,
        height: 50,
        style: { width: 110, height: 50 },
        data: { label: "Deploy", shape: "rectangle", color: "#0F2E18" }, // Green
      },
    ],
    edges: [
      { id: "e1", type: "canvasEdge", source: "source", target: "build", sourceHandle: "right", targetHandle: "left" },
      { id: "e2", type: "canvasEdge", source: "build", target: "test", sourceHandle: "right", targetHandle: "left" },
      { id: "e3", type: "canvasEdge", source: "test", target: "package", sourceHandle: "right", targetHandle: "left" },
      { id: "e4", type: "canvasEdge", source: "package", target: "approve", sourceHandle: "right", targetHandle: "left" },
      { id: "e5", type: "canvasEdge", source: "approve", target: "deploy", sourceHandle: "right", targetHandle: "left" },
    ],
  },
  {
    id: "event-driven",
    name: "Event-Driven System",
    description: "Producers publish events to a central bus. Independent consumers handle emails, push notifications, analytics, and error queues.",
    nodes: [
      {
        id: "prod-1",
        type: "canvasNode",
        position: { x: 50, y: 50 },
        width: 110,
        height: 45,
        style: { width: 110, height: 45 },
        data: { label: "Web Producer", shape: "rectangle", color: "#10233D" }, // Blue
      },
      {
        id: "prod-2",
        type: "canvasNode",
        position: { x: 50, y: 120 },
        width: 110,
        height: 45,
        style: { width: 110, height: 45 },
        data: { label: "Mobile Producer", shape: "rectangle", color: "#10233D" }, // Blue
      },
      {
        id: "prod-3",
        type: "canvasNode",
        position: { x: 50, y: 190 },
        width: 110,
        height: 45,
        style: { width: 110, height: 45 },
        data: { label: "IoT Producer", shape: "rectangle", color: "#10233D" }, // Blue
      },
      {
        id: "broker",
        type: "canvasNode",
        position: { x: 230, y: 100 },
        width: 110,
        height: 110,
        style: { width: 110, height: 110 },
        data: { label: "Event Broker", shape: "hexagon", color: "#2E1938" }, // Purple
      },
      {
        id: "cons-1",
        type: "canvasNode",
        position: { x: 410, y: 20 },
        width: 130,
        height: 45,
        style: { width: 130, height: 45 },
        data: { label: "Email Consumer", shape: "rectangle", color: "#0F2E18" }, // Green
      },
      {
        id: "cons-2",
        type: "canvasNode",
        position: { x: 410, y: 85 },
        width: 130,
        height: 45,
        style: { width: 130, height: 45 },
        data: { label: "Push Consumer", shape: "rectangle", color: "#0F2E18" }, // Green
      },
      {
        id: "cons-3",
        type: "canvasNode",
        position: { x: 410, y: 150 },
        width: 130,
        height: 45,
        style: { width: 130, height: 45 },
        data: { label: "Analytics Consumer", shape: "rectangle", color: "#0F2E18" }, // Green
      },
      {
        id: "cons-4",
        type: "canvasNode",
        position: { x: 410, y: 215 },
        width: 130,
        height: 45,
        style: { width: 130, height: 45 },
        data: { label: "Error Consumer", shape: "rectangle", color: "#3C1618" }, // Red
      },
      {
        id: "db",
        type: "canvasNode",
        position: { x: 610, y: 100 },
        width: 100,
        height: 80,
        style: { width: 100, height: 80 },
        data: { label: "TimescaleDB", shape: "cylinder", color: "#1F1F1F" },
      },
    ],
    edges: [
      { id: "e1", type: "canvasEdge", source: "prod-1", target: "broker", sourceHandle: "right", targetHandle: "left" },
      { id: "e2", type: "canvasEdge", source: "prod-2", target: "broker", sourceHandle: "right", targetHandle: "left" },
      { id: "e3", type: "canvasEdge", source: "prod-3", target: "broker", sourceHandle: "right", targetHandle: "left" },
      { id: "e4", type: "canvasEdge", source: "broker", target: "cons-1", sourceHandle: "right", targetHandle: "left" },
      { id: "e5", type: "canvasEdge", source: "broker", target: "cons-2", sourceHandle: "right", targetHandle: "left" },
      { id: "e6", type: "canvasEdge", source: "broker", target: "cons-3", sourceHandle: "right", targetHandle: "left" },
      { id: "e7", type: "canvasEdge", source: "broker", target: "cons-4", sourceHandle: "right", targetHandle: "left" },
      { id: "e8", type: "canvasEdge", source: "cons-3", target: "db", sourceHandle: "right", targetHandle: "left" },
    ],
  },
];
