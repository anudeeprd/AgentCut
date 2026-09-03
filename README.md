# AgentCut

> **Creative editing, agent-ready.**  
> Edit images and video yourself — or let your AI agent operate the editor through structured WebMCP tools.

AgentCut is a browser-based **image and video editor** built from the ground up to demonstrate that an external AI agent (such as ChatGPT with Site Tools) can understand and manipulate the real state of a creative editing application through imperative **WebMCP** tools.

---

## 🎯 The Core Philosophy: Single Source of Truth

Traditional creative tools (Photoshop, Premiere, Canva) are built for human eyes and cursors: dozens of sliders, menus, handles, and modals. For an AI agent, navigating visual UI with synthetic clicks or computer vision is brittle and slow.

AgentCut bridges this gap by exposing high-level, structured tools directly to the browser's model context via WebMCP (`document.modelContext.registerTool`).

* **Human UI and AI agent operate the exact same project state.**
* AgentCut contains **no internal LLM, no chatbot, and no API keys**. The reasoning comes from an external agent (e.g., ChatGPT).
* When an agent mutates the project, a subtle 2.5s toast notifies the user, and the visible canvas and timeline update immediately.
* When a human makes an edit, the agent can inspect the exact updated state.

```
                  External AI Agent (ChatGPT)
                              │
                    (WebMCP Imperative API)
                              ▼
                ┌───────────────────────────┐
                │    WebMCP Tool Layer      │
                │  (document.modelContext)  │
                └─────────────┬─────────────┘
                              │
                              ▼
┌──────────────┐       Canonical Store       ┌──────────────┐
│   Human UI   │ ◄─── (Single Source)  ───► │  Agent Toast │
│  (React 18)  │      Image & Video         │  (Feedback)  │
└──────────────┘                             └──────────────┘
```

---

## ✨ Features

### 🖼️ Image Editor Mode
* **Aspect Ratios**: Original, 1:1 (Square), 4:5 (Instagram Portrait), 16:9 (Landscape), 9:16 (Story/Vertical) with center-crop.
* **Transforms**: 90° rotation, horizontal flip, vertical flip.
* **Adjustments**: Brightness (-100 to 100), Contrast (-100 to 100), Saturation (-100 to 100), Grayscale (0 to 100%), Blur (0 to 20px).
* **Text Overlays**: Multiple text layers with semantic positioning (`top-left`, `center`, `bottom-center`, etc.), dynamic font size scaling, color, opacity, and drag-and-drop repositioning.
* **Independent History**: Dedicated undo/redo stack that never collides with video edits.
* **Real Export**: Client-side Canvas rendering to real PNG and JPG files reflecting all crops, transforms, filters, and text layers.

### 🎬 Video Editor Mode
* **Preview & Player**: Aspect ratio viewport (16:9, 9:16, 1:1, 4:5, Original), HTMLVideoElement player, interactive play/pause and time scrubbing.
* **Timeline**: Visual multi-track timeline featuring a seconds ruler, video clip track with active trimmed range vs dimmed masks, timed text overlay blocks, and interactive scrubber playhead.
* **Trim**: Non-destructive in-point and out-point trimming (e.g. remove first 2s of a 10s video).
* **Speed**: Playback rate control (0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×) with dynamic timeline duration adaptation.
* **Volume**: 0–100% volume slider and quick mute toggle.
* **Timed Text Overlays**: Text layers with `startTime` and `endTime` that display in the preview only while active and appear as colored blocks on the timeline.
* **Clip Segmentation**: Clip splitting and segment removal.
* **Independent History**: Dedicated undo/redo stack for video actions.

---

## 🛠️ Registered WebMCP Tools

AgentCut registers all tools imperatively using `document.modelContext.registerTool` (with `navigator.modelContext` fallback), adhering to React StrictMode safety via an `AbortController`.

### Image Tools
| Tool | Type | Description |
| :--- | :--- | :--- |
| `get_image_state` | Read-only | Returns source dimensions, canvas dimensions, aspect ratio, transforms, adjustments, text layers, and history. |
| `set_image_aspect_ratio` | Mutation | Sets aspect ratio (`original`, `1:1`, `4:5`, `16:9`, `9:16`). Updates canvas immediately. |
| `rotate_image` | Mutation | Rotates image by specified degrees (e.g. 90°). |
| `flip_image` | Mutation | Flips image horizontally or vertically. |
| `adjust_image` | Mutation | Updates brightness, contrast, saturation, grayscale, or blur. Only supplied fields change. |
| `add_image_text` | Mutation | Adds text overlay at a semantic position (`bottom-center`, `top-left`, etc.) with font size. Returns `textId`. |
| `update_image_text` | Mutation | Updates content, position, or font size of a specific text layer. |
| `remove_image_text` | Mutation | Removes a text layer by `textId`. |
| `undo_image_edit` | Mutation | Reverts the latest image editing action while keeping earlier edits. |
| `redo_image_edit` | Mutation | Re-applies the next edit from the redo stack. |
| `export_image` | Mutation | Triggers high-resolution canvas export to PNG or JPG. |

### Video Tools
| Tool | Type | Description |
| :--- | :--- | :--- |
| `get_video_state` | Read-only | Returns duration, effective duration, aspect ratio, trim bounds, speed, volume, and text overlays. |
| `get_timeline` | Read-only | Returns compact chronological timeline with clip segments and playhead. |
| `trim_video` | Mutation | Sets start and end timestamps (e.g. `startTime: 2, endTime: 10`). |
| `set_video_aspect_ratio` | Mutation | Sets aspect ratio to 9:16, 16:9, 1:1, 4:5, or original. |
| `set_video_speed` | Mutation | Adjusts playback speed (0.5× to 2×). |
| `set_video_volume` | Mutation | Adjusts volume (0-100) or mute status. |
| `add_video_text` | Mutation | Adds timed text overlay active between `startTime` and `endTime`. |
| `update_video_text` | Mutation | Updates text overlay content, timing, or position. |
| `remove_video_text` | Mutation | Removes timed text layer by `textId`. |
| `split_video` | Mutation | Splits clip at timestamp into two segments. |
| `delete_video_segment` | Mutation | Deletes a clip segment by ID. |
| `export_video` | Mutation | Downloads source video asset (prototype note: edits remain live in preview/timeline). |

---

## 🔍 Export Architecture & Prototype Transparency

In creative tools, honesty about rendered output versus preview state is paramount:

* **Image Export (Fully Functional Real Render)**:  
  Uses an offscreen HTML5 Canvas pipeline. When the human or agent clicks Export or calls `export_image`, the application renders the source image, applies exact aspect-ratio center-cropping, transforms (rotation, horizontal/vertical flips), color adjustments (brightness, contrast, saturation, grayscale, blur), and renders styled text layers with drop shadows. The resulting PNG or JPG file is generated on the client and directly downloaded.
* **Video Export (Source Download Only)**:  
  In this hackathon prototype, all video manipulations (trim in/out points, 9:16 vertical framing, 1.5× playback rate, timed text overlay visibility) operate in real-time within the HTMLVideoElement and interactive multi-track timeline. Full client-side video compositing and re-encoding into a newly rendered MP4 file was scoped out to ensure zero-crash browser reliability and fast execution during judge evaluation. `export_video` downloads the source video asset and returns structured metadata clearly disclosing this behavior.

---

## 💡 Example Demo Prompts

### Image Flow
1. *"Make this image 4:5, brighten it slightly and increase saturation."*
2. *"Add 'Explore More' centered near the bottom."*
3. *"Move the title to the top-left and make it smaller."*
4. *"Undo the last edit."*

### Video Flow
1. *"Remove the first 2 seconds of the video."*
2. *"Make this vertical 9:16 for Instagram Reels."*
3. *"Add 'Built with WebMCP' at the bottom from 2 to 6 seconds."*
4. *"Make the video 1.5× speed."*
5. *"What edits have we made so far?"*
6. *"Undo the speed change but keep everything else."*

---

## 📦 Bundled Demo Media (100% Offline)

To allow judges to test AgentCut instantly without hunting for files:
* **Demo Image**: High-resolution 1920×1080 landscape photograph (`/public/demo/sample-image.jpg`).
* **Demo Video**: 10-second 720p 30fps MP4 video with a live timer, frame numbers, moving elements, and audio tone (`/public/demo/sample-video.mp4`). Speed changes and trims are immediately obvious.

---

## 🚀 Getting Started

### Prerequisites
* Node.js 18+ (tested on Node v24)
* npm 9+

### Installation & Run
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

### Running Tests
```bash
npm run test
```
Runs 25 automated tests covering unit actions, WebMCP tool schemas, reactivity, and the complete Image and Video judge workflows.

### Production Build
```bash
npm run build
```

---

## 📄 License

MIT © AgentCut Contributors
