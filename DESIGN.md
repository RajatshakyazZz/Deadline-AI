---
name: DeadlineAI
description: Immersive, gamified, high-performance productivity command center
colors:
  primary: "#63B3ED" # Ice Blue
  secondary: "#9F7AEA" # Neon Violet
  tertiary: "#68D391" # Fresh Teal
  neutral-bg: "#050810" # Cosmic Void Black
  neutral-fg: "#F7FAFC" # Frost White
  crisis-red: "#FC8181" # Emergency Red
  warning-orange: "#F6AD55" # Caution Orange
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  mono:
    fontFamily: "JetBrains Mono, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
rounded:
  sm: "8px"
  md: "12px"
  lg: "20px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  card:
    backgroundColor: "rgba(255, 255, 255, 0.05)"
    rounded: "{rounded.lg}"
    padding: "20px"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "#4299E1"
---

# Design System: DeadlineAI

## 1. Overview

**Creative North Star: "Cosmic Command Flight Deck"**

The DeadlineAI interface is designed to emulate the clean, high-intensity atmosphere of a spacecraft cockpit or high-performance command center. Rather than generic corporate cards or heavily saturated gamified pixels, it leans into physical, glassmorphic textures, dark translucent layers, and crisp typography to encourage deep mental focus. It is designed to turn procrastination panic into structured execution flow.

The visual style is defined by a deep cosmic void background (`#050810`), punctuated by physical "liquid-glass" surfaces that caught specular light reflections. Vibrant, glowing high-chroma accents (such as Ice Blue and Neon Violet) are used deliberately as visual beacons to guide attention to active tasks and countdowns. 

### Key Characteristics:
- **Liquid Glass Materials**: Real-time glassmorphism that blends into the cosmic background via ultra-high blur radii (`backdrop-filter: blur(40px)`).
- **Physical Specular Highlights**: Subtle 1px gradients on borders to capture ambient light.
- **Instrument-grade Typography**: A balanced pairing of "Space Grotesk" for modern headings and "JetBrains Mono" for numbers, times, and system telemetry readouts.
- **Symmetric Intentional Rhythm**: Carefully aligned margins, fluid desktop layouts, and large, touch-safe targets.

---

## 2. Colors

The color palette is high-contrast, designed to make information stand out instantly against the deep dark canvas. 

### Primary
- **Ice Blue** (`#63B3ED`): The default high-performance color. Used for active tasks, positive progress, main CTA accents, and friendly telemetry hints.

### Secondary
- **Neon Violet** (`#9F7AEA`): The intellectual flow-state color. Used to represent focus sessions, streak achievements, and Aria's specialized cognitive responses.

### Tertiary
- **Fresh Teal** (`#68D391`): The completion color. Reserved for checked-off items, success metrics, and stabilized habits.

### Neutral
- **Cosmic Void Black** (`#050810`): The base canvas background. Ensures absolute visual comfort and zero eye fatigue during extended late-night focus sessions.
- **Frost White** (`#F7FAFC`): Crisp, highly-legible foreground text.
- **Space Slate** (`#A0AEC0`): Secondary text label color. Offers subtle hierarchy and breathing room.

### Emergency & Alert Colors
- **Emergency Red** (`#FC8181`): Used for Crisis Mode tasks with under 3 hours remaining on their deadlines.
- **Caution Orange** (`#F6AD55`): Used for warnings, ticking timers, and high-priority flags.

### Named Rules
**The 80-15-5 Accent Rule.** The primary accent is used on ≤5% of any given screen. Its rarity is the point. 80% is the deep dark base background, 15% consists of glassy containers and borders, and exactly 5% is the vibrant high-chroma active accent.

**The Glass Horizon Rule.** Solid opaque colors are strictly prohibited for layouts. All UI containers must use translucent layers to allow the underlying particle grids and glowing orbs to gently filter through.

---

## 3. Typography

**Display Font:** Space Grotesk (with fallback `ui-sans-serif, system-ui, sans-serif`)  
**Body Font:** Space Grotesk (with fallback `ui-sans-serif, system-ui, sans-serif`)  
**Label/Mono Font:** JetBrains Mono (with fallback `ui-monospace, SFMono-Regular, monospace`)

### Character
Space Grotesk's geometric quirks provide an energetic, futuristic, and friendly personality. JetBrains Mono is paired with it for a mechanical, highly-structured aesthetic for numbers and times.

### Hierarchy
- **Display** (Bold, `clamp(2rem, 5vw, 3rem)`, `line-height: 1.1`): Used exclusively for main page headings, greetings, and empty-state headlines.
- **Headline** (SemiBold, `1.5rem`, `line-height: 1.3`): Section titles, modal headers, and main metrics.
- **Title** (Medium, `1.125rem`, `line-height: 1.4`): Individual task titles, habits, and quick-reply options.
- **Body** (Regular, `1rem`, `line-height: 1.5`): General descriptive text, chat transcripts, and settings descriptions. Max line length of `65ch` for high readability.
- **Label** (Bold, `0.75rem`, `letter-spacing: 0.1em`, Uppercase): Monospaced table headers, telemetry labels, and micro-metrics.

### Named Rules
**The Telemetry Monospace Rule.** Every number, countdown timer, date, calendar day, streak, or percentage value MUST be rendered in JetBrains Mono. Standard proportional sans-serif fonts are prohibited for variables that change state in real-time.

---

## 4. Elevation

In a glass-morphic environment, elevation is communicated through border gradients and backdrops rather than traditional drop-shadow offsets.

### Shadow Vocabulary
- **Cockpit Glow** (`0 8px 32px rgba(0, 0, 0, 0.35), 0 2px 8px rgba(0, 0, 0, 0.2)`): The default shadow layer underneath the `liquid-glass` cards to lift them off the deep space void.
- **Active Inset Glow** (`0 0 0 0.5px rgba(255,255,255,0.08) inset, 0 1px 0 0 rgba(255,255,255,0.2) inset`): Simulated light catches on the top edge of translucent surfaces, creating immediate material realism.

### Named Rules
**The Border Specularity Rule.** Every card surface MUST use a 1px border which has a lighter opacity on the top (`border-top: 1px solid rgba(255, 255, 255, 0.3)`) than on the sides and bottom. This simulates an physical piece of glass capturing light from above.

---

## 5. Components

### Cards & Containers
- **Corner Style**: Rounded corners (20px radius).
- **Background**: Translucent white overlay (`rgba(255, 255, 255, 0.05)`) with an ultra-high blur factor (`blur(40px)`).
- **Border**: Light specular borders.

### Buttons
- **Corner Style**: Rounded (12px radius).
- **Primary**: Solid background using **Ice Blue** (`#63B3ED`) or **Neon Violet** (`#9F7AEA`), with dark text (`#050810`).
- **Interactive States**: Transitions to hover should use smooth transformations (`transform: scale(1.02) translateY(-1px)`).
- **Apple Glass Buttons**: Desaturated button option (`.apple-glass-btn`) used for secondary controls.

### Inputs / Fields
- **Style**: Curved edges (12px radius), translucent void background, subtle border (`1px solid rgba(255, 255, 255, 0.1)`).
- **Focus**: Transitions to a crisp glowing ring using the primary Ice Blue or Neon Violet color accent.

### Navigation Sidebar
- **Style**: Sticky left sidebar with vertical command options. Uses dynamic, responsive dot highlights and translucent background fills on active selection.

---

## 6. Do's and Don'ts

### Do:
- **Do** wrap every major interactive panel inside a `liquid-glass` card element with standard `20px` corners.
- **Do** typecast all countdown timers, Pomodoro clocks, and calendar numbers in the uppercase `font-mono` family (JetBrains Mono).
- **Do** display a clear, high-contrast visual distinction when a task enters Crisis Mode (e.g. glowing orange or red borders with relative time counters).
- **Do** design with tactile, generous click boundaries (touch targets must be at least 44px).

### Don't:
- **Don't** use standard, opaque gray panels or flat, unblurred card layouts. If a background isn't blurred, it isn't on-brand.
- **Don't** use decorative purple-to-pink gradient fills for the body background. The void canvas must stay deep, clean, and restful (`#050810`).
- **Don't** add unrequested telemetry data, server details, or simulated container port labels. Human, clean labels are the gold standard.
