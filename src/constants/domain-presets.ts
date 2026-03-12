import type { Application, ResumeVersion, RoadmapWeek, Question, Profile } from '../types'
import { normalizeRoleCategory } from './config'

export type DomainId = 'gen-ai' | 'data-science' | 'frontend' | 'backend' | 'fullstack' | 'cybersecurity' | 'cloud-devops' | 'product-management'

export interface DomainPreset {
  id: DomainId
  name: string
  emoji: string
  description: string
  color: string
  profile: Partial<Profile>
  applications: Omit<Application, 'id'>[]
  resumeVersions: Omit<ResumeVersion, 'id'>[]
  roadmap: Omit<RoadmapWeek, 'id'>[]
  questions: Omit<Question, 'id'>[]
}

/** Helper: build a full Application record from partial data */
function app(d: Partial<Omit<Application, 'id'>> & { company: string; role: string; status: Application['status']; dateApplied: string }): Omit<Application, 'id'> {
  const roleCategory = d.roleCategory || normalizeRoleCategory(d.role)
  return {
    company: d.company,
    role: d.role,
    roleCategory,
    customRoleTag: d.customRoleTag || '',
    department: d.department || '',
    jobLink: d.jobLink || '',
    source: d.source || 'LinkedIn',
    location: d.location || 'San Francisco, CA',
    workMode: d.workMode || 'Remote',
    salaryRange: d.salaryRange || '',
    dateSaved: d.dateSaved || d.dateApplied,
    dateApplied: d.dateApplied,
    lastStatusUpdate: d.lastStatusUpdate || d.dateApplied,
    status: d.status,
    resumeVersion: d.resumeVersion || '',
    coverLetter: d.coverLetter || '',
    contactName: d.contactName || '',
    contactEmail: d.contactEmail || '',
    referral: d.referral || false,
    referralStatus: d.referralStatus || '',
    priority: d.priority || 'Medium',
    followUpDate: d.followUpDate || '',
    interviewDate: d.interviewDate || '',
    rejectionReason: d.rejectionReason || '',
    notes: d.notes || '',
    outcomeNotes: d.outcomeNotes || '',
    confidenceLevel: d.confidenceLevel ?? 50,
    companyType: d.companyType || 'Startup',
    targetType: d.targetType || 'Realistic',
    statusHistory: d.statusHistory || [{ status: d.status, date: d.dateApplied }],
  }
}

export const DOMAIN_PRESETS: DomainPreset[] = [
  /* ── 1. GEN AI / ML ───────────────────────────── */
  {
    id: 'gen-ai',
    name: 'Generative AI & ML',
    emoji: '\u{1F9E0}',
    description: 'LLMs, diffusion models, NLP, ML engineering',
    color: 'from-purple-600 to-indigo-600',
    profile: {
      targetRoles: ['ML Engineer', 'AI Research Scientist', 'LLM Engineer', 'Applied Scientist', 'NLP Engineer'],
      dreamCompanies: ['OpenAI', 'Anthropic', 'Google DeepMind', 'Meta AI', 'Cohere'],
      searchStartDate: '2025-01-06',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'Transformer Foundations', theme: '', topics: 'Attention, self-attention, multi-head attention, positional encodings', completed: true, tasks: ['Read Attention Is All You Need', 'Implement scaled dot-product attention', 'Build a mini transformer encoder'], completedTasks: [], estimatedHours: 15, notes: '' },
      { week: 2, title: 'Large Language Models', theme: '', topics: 'GPT architecture, tokenization, BPE, inference optimization', completed: true, tasks: ['Implement BPE tokenizer', 'Fine-tune GPT-2 on custom data', 'Explore KV cache'], completedTasks: [], estimatedHours: 18, notes: '' },
      { week: 3, title: 'Prompt Engineering & RAG', theme: '', topics: 'Few-shot prompting, chain-of-thought, retrieval augmented generation', completed: true, tasks: ['Build a RAG pipeline', 'Compare retrieval methods', 'Evaluate with RAGAS'], completedTasks: [], estimatedHours: 12, notes: '' },
      { week: 4, title: 'Fine-Tuning & RLHF', theme: '', topics: 'LoRA, QLoRA, DPO, PPO for alignment', completed: false, tasks: ['Fine-tune LLaMA with LoRA', 'Implement DPO training loop', 'Compare RLHF vs DPO'], completedTasks: [], estimatedHours: 20, notes: '' },
      { week: 5, title: 'Diffusion Models', theme: '', topics: 'DDPM, stable diffusion, ControlNet, image generation', completed: false, tasks: ['Implement DDPM from scratch', 'Train on MNIST', 'Explore ControlNet'], completedTasks: [], estimatedHours: 18, notes: '' },
      { week: 6, title: 'ML Systems Design', theme: '', topics: 'System design for ML, serving, monitoring, A/B testing', completed: false, tasks: ['Design a recommendation system', 'Study ML system design patterns', 'Practice whiteboard designs'], completedTasks: [], estimatedHours: 15, notes: '' },
      { week: 7, title: 'Multimodal Models', theme: '', topics: 'CLIP, vision transformers, audio models, cross-modal learning', completed: false, tasks: ['Implement CLIP-style training', 'Build image-text retrieval', 'Explore whisper architecture'], completedTasks: [], estimatedHours: 16, notes: '' },
      { week: 8, title: 'Deployment & MLOps', theme: '', topics: 'Model serving, ONNX, quantization, monitoring in production', completed: false, tasks: ['Deploy model with TorchServe', 'Implement model monitoring', 'Practice quantization'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 9, title: 'Agent Frameworks', theme: '', topics: 'LangChain agents, tool use, function calling, multi-agent systems', completed: false, tasks: ['Build a ReAct agent', 'Implement tool-using agent', 'Compare agent frameworks'], completedTasks: [], estimatedHours: 16, notes: '' },
      { week: 10, title: 'Mock Interviews & Review', theme: '', topics: 'Full mock interviews, system design practice, behavioral prep', completed: false, tasks: ['Complete 3 mock interviews', 'Review all topics', 'Refine resume'], completedTasks: [], estimatedHours: 20, notes: '' },
    ],
    questions: [
      { category: 'Transformers', question: 'Explain the attention mechanism in transformers.', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Transformers', question: 'What is the difference between self-attention and cross-attention?', difficulty: 'Medium', status: 'In Progress', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Transformers', question: 'How does multi-head attention improve model performance?', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'LLMs', question: 'How does GPT differ from BERT architecturally?', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'LLMs', question: 'What is the role of RLHF in LLM alignment?', difficulty: 'Hard', status: 'Needs Work', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'LLMs', question: 'Explain the trade-offs of model quantization.', difficulty: 'Hard', status: 'In Progress', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'NLP', question: 'Describe the BPE tokenization algorithm.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'NLP', question: 'What are the advantages of subword tokenization?', difficulty: 'Easy', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Diffusion', question: 'Explain the forward and reverse process in diffusion models.', difficulty: 'Hard', status: 'Not Started', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'ML Systems', question: 'Design a real-time recommendation system.', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'ML Systems', question: 'How would you monitor ML model performance in production?', difficulty: 'Medium', status: 'Needs Work', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'RAG', question: 'Compare dense retrieval vs sparse retrieval for RAG.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'RAG', question: 'How do you evaluate RAG pipeline quality?', difficulty: 'Medium', status: 'In Progress', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Behavioral', question: 'Tell me about a challenging ML project you worked on.', difficulty: 'Easy', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Behavioral', question: 'How do you prioritize between model accuracy and latency?', difficulty: 'Medium', status: 'In Progress', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 2. DATA SCIENCE ───────────────────────────── */
  {
    id: 'data-science',
    name: 'Data Science & Analytics',
    emoji: '\u{1F4CA}',
    description: 'Statistical modeling, A/B testing, data pipelines',
    color: 'from-blue-600 to-cyan-600',
    profile: {
      targetRoles: ['Data Scientist', 'Senior Data Analyst', 'ML Engineer', 'Analytics Engineer'],
      dreamCompanies: ['Spotify', 'Netflix', 'Airbnb', 'Stripe', 'Google'],
      searchStartDate: '2025-01-13',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'Statistics Foundations', theme: '', topics: 'Hypothesis testing, confidence intervals, Bayesian vs frequentist', completed: true, tasks: ['Review hypothesis testing', 'Practice CI calculations'], completedTasks: [], estimatedHours: 12, notes: '' },
      { week: 2, title: 'A/B Testing Deep Dive', theme: '', topics: 'Power analysis, multi-armed bandits, sequential testing', completed: true, tasks: ['Implement power calculator', 'Study MAB algorithms'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 3, title: 'SQL & Data Modeling', theme: '', topics: 'Window functions, CTEs, dimensional modeling', completed: false, tasks: ['Solve 20 SQL problems', 'Design star schema'], completedTasks: [], estimatedHours: 10, notes: '' },
      { week: 4, title: 'ML for DS', theme: '', topics: 'Feature engineering, model selection, evaluation metrics', completed: false, tasks: ['Build end-to-end pipeline', 'Compare model metrics'], completedTasks: [], estimatedHours: 15, notes: '' },
      { week: 5, title: 'Case Studies', theme: '', topics: 'Metric definition, growth analysis, product analytics', completed: false, tasks: ['Complete 5 case studies', 'Practice presentations'], completedTasks: [], estimatedHours: 16, notes: '' },
    ],
    questions: [
      { category: 'Statistics', question: 'Explain the Central Limit Theorem and its importance.', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'A/B Testing', question: 'How would you determine sample size for an A/B test?', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'SQL', question: 'Write a query using window functions to calculate running averages.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Product', question: 'You notice a 5% drop in DAUs. How do you investigate?', difficulty: 'Hard', status: 'Needs Work', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'ML', question: 'When would you choose Logistic Regression over Random Forest?', difficulty: 'Medium', status: 'In Progress', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 3. FRONTEND ───────────────────────────── */
  {
    id: 'frontend',
    name: 'Frontend Development',
    emoji: '\u{1F3A8}',
    description: 'React, TypeScript, UI/UX, web performance',
    color: 'from-cyan-600 to-blue-600',
    profile: {
      targetRoles: ['Frontend Engineer', 'UI Engineer', 'React Developer', 'Full Stack (Frontend Heavy)'],
      dreamCompanies: ['Vercel', 'Figma', 'Shopify', 'Notion', 'Linear'],
      searchStartDate: '2025-01-20',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'React Deep Dive', theme: '', topics: 'Hooks internals, fiber architecture, concurrent features', completed: true, tasks: ['Build custom hooks', 'Study fiber reconciliation'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 2, title: 'TypeScript Mastery', theme: '', topics: 'Advanced types, generics, type-level programming', completed: true, tasks: ['Complete type challenges', 'Build typed utility library'], completedTasks: [], estimatedHours: 12, notes: '' },
      { week: 3, title: 'Performance & Web Vitals', theme: '', topics: 'Core Web Vitals, bundle optimization, lazy loading', completed: false, tasks: ['Audit and optimize a real site', 'Implement code splitting'], completedTasks: [], estimatedHours: 10, notes: '' },
      { week: 4, title: 'State Management & Testing', theme: '', topics: 'Zustand, Jotai, React Testing Library, Playwright', completed: false, tasks: ['Compare state management libs', 'Write E2E tests'], completedTasks: [], estimatedHours: 15, notes: '' },
    ],
    questions: [
      { category: 'React', question: 'Explain the virtual DOM reconciliation process.', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'React', question: 'What are the rules of hooks and why do they exist?', difficulty: 'Easy', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'TypeScript', question: 'Explain the difference between type and interface.', difficulty: 'Easy', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Performance', question: 'How would you optimize a slow React application?', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'CSS', question: 'Explain CSS specificity and cascade.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 4. BACKEND ───────────────────────────── */
  {
    id: 'backend',
    name: 'Backend Engineering',
    emoji: '\u{2699}\u{FE0F}',
    description: 'APIs, distributed systems, databases, cloud',
    color: 'from-green-600 to-emerald-600',
    profile: {
      targetRoles: ['Backend Engineer', 'Platform Engineer', 'Systems Engineer', 'API Engineer'],
      dreamCompanies: ['Stripe', 'Cloudflare', 'Datadog', 'Confluent', 'PlanetScale'],
      searchStartDate: '2025-01-06',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'System Design Fundamentals', theme: '', topics: 'Load balancing, caching, database sharding, CAP theorem', completed: true, tasks: ['Study CAP theorem', 'Design URL shortener'], completedTasks: [], estimatedHours: 15, notes: '' },
      { week: 2, title: 'Databases Deep Dive', theme: '', topics: 'B-trees, LSM trees, indexing, query optimization', completed: false, tasks: ['Compare B-tree vs LSM', 'Practice query optimization'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 3, title: 'Distributed Systems', theme: '', topics: 'Consensus protocols, Raft, event sourcing, CQRS', completed: false, tasks: ['Implement Raft simulator', 'Study event sourcing patterns'], completedTasks: [], estimatedHours: 18, notes: '' },
      { week: 4, title: 'API Design & gRPC', theme: '', topics: 'REST vs GraphQL vs gRPC, versioning, rate limiting', completed: false, tasks: ['Build gRPC service', 'Implement rate limiter'], completedTasks: [], estimatedHours: 12, notes: '' },
    ],
    questions: [
      { category: 'System Design', question: 'Design a URL shortener like bit.ly.', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Databases', question: 'Explain the difference between B-tree and LSM-tree indices.', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Distributed Systems', question: 'What is CAP theorem? Give real-world examples.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'APIs', question: 'When would you choose gRPC over REST?', difficulty: 'Medium', status: 'Not Started', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 5. FULLSTACK ───────────────────────────── */
  {
    id: 'fullstack',
    name: 'Full Stack Development',
    emoji: '\u{1F310}',
    description: 'End-to-end web development, React + Node/Python',
    color: 'from-amber-600 to-orange-600',
    profile: {
      targetRoles: ['Full Stack Engineer', 'Software Engineer', 'Product Engineer'],
      dreamCompanies: ['Vercel', 'Supabase', 'Retool', 'Linear', 'Notion'],
      searchStartDate: '2025-01-13',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'React + TypeScript Patterns', theme: '', topics: 'Advanced hooks, compound components, render props', completed: true, tasks: ['Build compound component library', 'Master custom hooks'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 2, title: 'Backend Architecture', theme: '', topics: 'Clean architecture, dependency injection, testing strategies', completed: false, tasks: ['Implement clean arch project', 'Write unit + integration tests'], completedTasks: [], estimatedHours: 16, notes: '' },
      { week: 3, title: 'Database & API Design', theme: '', topics: 'Schema design, REST API best practices, GraphQL', completed: false, tasks: ['Design a multi-tenant schema', 'Build REST + GraphQL API'], completedTasks: [], estimatedHours: 14, notes: '' },
    ],
    questions: [
      { category: 'Full Stack', question: 'How do you decide what runs on the client vs server?', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Architecture', question: 'Explain the trade-offs of monolith vs microservices.', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Databases', question: 'How do you handle database migrations in production?', difficulty: 'Medium', status: 'Needs Work', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 6. CYBERSECURITY ───────────────────────────── */
  {
    id: 'cybersecurity',
    name: 'Cybersecurity',
    emoji: '\u{1F6E1}\u{FE0F}',
    description: 'Security engineering, pentesting, cloud security',
    color: 'from-red-600 to-rose-600',
    profile: {
      targetRoles: ['Security Engineer', 'Penetration Tester', 'Cloud Security Engineer', 'AppSec Engineer'],
      dreamCompanies: ['CrowdStrike', 'Palo Alto Networks', 'Snyk', 'Wiz', 'Google'],
      searchStartDate: '2025-01-06',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'Web Application Security', theme: '', topics: 'OWASP Top 10, XSS, SQLi, CSRF, security headers', completed: true, tasks: ['Study OWASP Top 10', 'Practice on WebGoat'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 2, title: 'Cloud Security', theme: '', topics: 'AWS IAM, security groups, VPC, CloudTrail, GuardDuty', completed: false, tasks: ['Set up secure VPC', 'Configure CloudTrail'], completedTasks: [], estimatedHours: 16, notes: '' },
      { week: 3, title: 'Penetration Testing', theme: '', topics: 'Methodology, tools, reporting, bug bounty', completed: false, tasks: ['Complete HTB machines', 'Write pentest report'], completedTasks: [], estimatedHours: 18, notes: '' },
    ],
    questions: [
      { category: 'Web Security', question: 'Explain the OWASP Top 10 vulnerabilities.', difficulty: 'Medium', status: 'Confident', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Cloud Security', question: 'How do you secure an AWS VPC?', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Cryptography', question: 'Compare symmetric vs asymmetric encryption.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 7. CLOUD & DEVOPS ───────────────────────────── */
  {
    id: 'cloud-devops',
    name: 'Cloud & DevOps',
    emoji: '\u{2601}\u{FE0F}',
    description: 'AWS/GCP/Azure, Kubernetes, CI/CD, IaC',
    color: 'from-orange-600 to-amber-600',
    profile: {
      targetRoles: ['Cloud Engineer', 'DevOps Engineer', 'SRE', 'Platform Engineer'],
      dreamCompanies: ['HashiCorp', 'Datadog', 'GitLab', 'AWS', 'Vercel'],
      searchStartDate: '2025-01-13',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'Kubernetes Deep Dive', theme: '', topics: 'Pods, services, deployments, networking, RBAC', completed: true, tasks: ['Deploy multi-service app', 'Configure RBAC'], completedTasks: [], estimatedHours: 16, notes: '' },
      { week: 2, title: 'Infrastructure as Code', theme: '', topics: 'Terraform modules, state management, best practices', completed: false, tasks: ['Build Terraform modules', 'Set up remote state'], completedTasks: [], estimatedHours: 14, notes: '' },
      { week: 3, title: 'CI/CD Pipelines', theme: '', topics: 'GitHub Actions, ArgoCD, GitOps workflows', completed: false, tasks: ['Build CI/CD pipeline', 'Implement GitOps'], completedTasks: [], estimatedHours: 12, notes: '' },
    ],
    questions: [
      { category: 'Kubernetes', question: 'Explain how Kubernetes networking works.', difficulty: 'Hard', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'IaC', question: 'How do you manage Terraform state in a team?', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'CI/CD', question: 'Design a CI/CD pipeline for a microservices app.', difficulty: 'Hard', status: 'Needs Work', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
    ],
  },

  /* ── 8. PRODUCT MANAGEMENT ───────────────────────────── */
  {
    id: 'product-management',
    name: 'Product Management',
    emoji: '\u{1F4CB}',
    description: 'Product strategy, metrics, user research, roadmapping',
    color: 'from-pink-600 to-rose-600',
    profile: {
      targetRoles: ['Product Manager', 'Senior PM', 'Technical PM', 'Growth PM'],
      dreamCompanies: ['Stripe', 'Notion', 'Figma', 'Slack', 'Spotify'],
      searchStartDate: '2025-01-13',
      weeklyAppTarget: 50,
    },
    applications: [],
    resumeVersions: [],
    roadmap: [
      { week: 1, title: 'Product Frameworks', theme: '', topics: 'RICE, ICE, Kano model, Jobs to Be Done', completed: true, tasks: ['Study RICE framework', 'Apply JTBD to a product'], completedTasks: [], estimatedHours: 10, notes: '' },
      { week: 2, title: 'Metrics & Analytics', theme: '', topics: 'North star metrics, funnel analysis, cohort analysis', completed: false, tasks: ['Define NSM for 3 products', 'Build cohort analysis'], completedTasks: [], estimatedHours: 12, notes: '' },
      { week: 3, title: 'Product Case Studies', theme: '', topics: 'Product sense, estimation, go-to-market strategy', completed: false, tasks: ['Practice 10 PM cases', 'Prepare GTM strategy'], completedTasks: [], estimatedHours: 14, notes: '' },
    ],
    questions: [
      { category: 'Product Sense', question: 'How would you improve Instagram Stories?', difficulty: 'Medium', status: 'In Progress', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
      { category: 'Metrics', question: 'Define the north star metric for Uber.', difficulty: 'Medium', status: 'Confident', notes: '', starred: false, sampleAnswer: '', lastPracticed: null },
      { category: 'Strategy', question: 'Should Spotify launch a podcast-only subscription?', difficulty: 'Hard', status: 'Needs Work', notes: '', starred: true, sampleAnswer: '', lastPracticed: null },
    ],
  },
]

export function getDomainPreset(id: DomainId): DomainPreset {
  return DOMAIN_PRESETS.find(d => d.id === id) || DOMAIN_PRESETS[0]
}