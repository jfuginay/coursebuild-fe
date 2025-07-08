# CourseBuild AI

**AI-powered course creation platform that transforms course concepts into comprehensive learning experiences through intelligent video analysis and automated content generation.**

## 🚀 Quick Start

```bash
# Clone and setup
git clone https://github.com/jfuginay/coursebuild-fe.git
cd coursebuild-fe
npm install

# Start Next.js development server
cd courseforge-ai
npm run dev

# Task management system
npm run task:list  # See all tasks
npm run monitor:scan  # Auto-detect tasks from code
```

## 🎓 Course Creation System

### Overview
Transform course concepts into comprehensive learning experiences using AI-powered video analysis and automated content generation.

### Current Features

#### 🟢 AI-Powered Course Generation
- **Video Analysis** - Extract key concepts from instructional videos
- **Content Generation** - Create course outlines and materials
- **Interactive Components** - Quiz generation and assessments
- **Multi-format Export** - Support for various learning platforms

#### 🟡 Course Management (In Development)
- **Progress Tracking** - Student progress monitoring
- **Analytics Dashboard** - Course performance metrics
- **Collaboration Tools** - Team-based course creation
- **LMS Integration** - Export to popular learning management systems

### Implementation

```javascript
// Process video for course content
const processor = new VideoAIProcessor();
const analysis = await processor.analyzeVideo(videoFile);

// Generate course structure
const courseBuilder = new CourseBuilder();
const course = courseBuilder.generateCourse(analysis, userPrompt);

// Create interactive components
const quizGenerator = new QuizGenerator();
const quiz = quizGenerator.createQuiz(course.modules);
```

### User Experience

1. **Upload video** or provide course concept
2. **AI analyzes content** and extracts key information
3. **Review generated structure** and customize
4. **Export to preferred format** - Done! ✅

## 🧠 AI Pipeline

```
Video Upload → Speech/Vision Analysis → Content Extraction → Course Structure → Interactive Elements → Export
```

### Features
- **Multi-modal analysis** of video and audio content
- **Concept extraction** and organization
- **Automated quiz generation**
- **Interactive component creation**
- **Personalized learning paths**

## 🗄️ Database Schema (Supabase)

```sql
-- Core tables
profiles          -- User profiles and preferences
courses           -- Course data and metadata
course_modules    -- Individual course sections
video_analyses    -- AI analysis results
quizzes           -- Generated assessments
```

### Key Features
- **Row Level Security** enabled
- **Real-time subscriptions** for live updates
- **Full-text search** with rankings
- **Progress tracking**
- **Analytics events**

## 🔄 Task Management System

### Smart Task Detection
```bash
# Scan codebase for tasks
npm run monitor:scan

# Auto-detects:
# - TODO/FIXME comments
# - Security issues (hardcoded keys)
# - Missing tests
# - Code quality issues
```

### Task Master
```bash
# Add tasks with auto-prioritization
npm run task:add "Implement video processing pipeline"

# View prioritized board
npm run task:list

# Complete tasks
npm run task:complete <id>
```

## 🏗️ Architecture

```
courseforge-ai/            # Next.js frontend application
├── components/            # React components
├── pages/                 # Next.js pages
├── services/             # API services
└── utils/                # Utility functions

components/
├── VideoListingCamera.jsx # Video capture component
└── course-builder/       # Course creation UI

services/
├── video-ai-processor.js # Video analysis service
├── supabase-client.js    # Database operations
└── task-monitor.js       # RAG task detection
```

## 🎯 AI Integration APIs

### ✅ Video Analysis
- **OpenAI GPT-4** - Content analysis and generation
- **Google AI** - Speech-to-text and vision processing
- **Anthropic Claude** - Advanced reasoning and course structure

### ⚠️ Learning Platform Integration  
- **Moodle** - LMS export support
- **Canvas** - Course import/export
- **Teachable** - Content formatting

### 📋 Export Formats
- **SCORM** - Standard e-learning format
- **xAPI** - Learning analytics
- **PDF** - Course materials export

## 🚀 Deployment

### Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod

# Environment variables needed:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - OPENAI_API_KEY
# - GOOGLE_AI_API_KEY
```

### Local Development
```bash
# Start development server
cd courseforge-ai
npm run dev

# Build for production
npm run build
```

## 🤝 Contributing

### Getting Started
1. **Pick a task** from `npm run task:list`
2. **Join Discord** for team coordination
3. **Submit PR** with tests
4. **Get quick review** (< 24hr turnaround)

### First Good Issues
- Enhance video processing pipeline
- Improve AI course structure generation
- Add new export format support
- Create interactive component templates
- Enhance quiz generation algorithms

## 📊 Success Metrics

- **100 beta users** in first week
- **10 contributors** in first month  
- **1000 GitHub stars** in 3 months
- **5+ LMS integrations**
- **80% time savings** vs manual course creation

## 🎯 Roadmap

### Phase 1 (Week 1) - MVP
- [x] Next.js frontend setup
- [x] Video capture component
- [x] AI video processor service
- [ ] Course generation pipeline
- [ ] Basic export functionality

### Phase 2 (Month 1) - Growth
- [ ] Enhanced AI analysis
- [ ] Multiple export formats
- [ ] User authentication
- [ ] Course collaboration features

### Phase 3 (Month 3) - Scale
- [ ] Enterprise features
- [ ] Advanced analytics
- [ ] LMS partnerships
- [ ] Open source ecosystem

## 💡 Vision

**"The Stripe for course creation"** - Universal API and tools for anyone to build educational applications. Make course creation as easy as recording a video.

## 🔗 Links

- **Demo Video**: Coming soon
- **Discord**: [Join our community](link)
- **Documentation**: [Full docs](link)  
- **API Reference**: [API docs](link)

---

Built with ❤️ by the CourseBuild team using Claude Code