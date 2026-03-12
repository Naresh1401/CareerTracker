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
      weeklyAppTarget: 5,
    },
    applications: [
      app({ company: 'OpenAI', role: 'Research Engineer', status: 'Technical Interview', dateApplied: '2025-01-15', lastStatusUpdate: '2025-02-10', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'ML Research v2', confidenceLevel: 75, referral: true, referralStatus: 'Submitted', workMode: 'Hybrid', location: 'San Francisco, CA', salaryRange: '$200k-$350k', interviewDate: '2025-02-15', statusHistory: [{ status: 'Applied', date: '2025-01-15' }, { status: 'Recruiter Screen', date: '2025-01-28' }, { status: 'Technical Interview', date: '2025-02-10' }] }),
      app({ company: 'Anthropic', role: 'ML Engineer', status: 'Phone Screen', dateApplied: '2025-01-20', lastStatusUpdate: '2025-02-05', source: 'Referral', priority: 'High', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'ML Research v2', confidenceLevel: 70, referral: true, referralStatus: 'Connected', workMode: 'Remote', location: 'San Francisco, CA', salaryRange: '$180k-$300k', statusHistory: [{ status: 'Applied', date: '2025-01-20' }, { status: 'Phone Screen', date: '2025-02-05' }] }),
      app({ company: 'Google DeepMind', role: 'Research Scientist', status: 'OA', dateApplied: '2025-01-10', lastStatusUpdate: '2025-01-25', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'ML Research v2', confidenceLevel: 60, workMode: 'Hybrid', location: 'Mountain View, CA', salaryRange: '$200k-$400k', statusHistory: [{ status: 'Applied', date: '2025-01-10' }, { status: 'OA', date: '2025-01-25' }] }),
      app({ company: 'Meta AI', role: 'Applied ML Engineer', status: 'Applied', dateApplied: '2025-02-01', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'ML Eng General', confidenceLevel: 55, workMode: 'Hybrid', location: 'Menlo Park, CA' }),
      app({ company: 'Cohere', role: 'NLP Engineer', status: 'Recruiter Screen', dateApplied: '2025-01-25', lastStatusUpdate: '2025-02-08', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'ML Eng General', confidenceLevel: 65, workMode: 'Remote', location: 'Toronto, ON', statusHistory: [{ status: 'Applied', date: '2025-01-25' }, { status: 'Recruiter Screen', date: '2025-02-08' }] }),
      app({ company: 'Hugging Face', role: 'ML Engineer', status: 'Applied', dateApplied: '2025-02-03', source: 'Company Site', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', resumeVersion: 'ML Eng General', confidenceLevel: 60, workMode: 'Remote', location: 'New York, NY' }),
      app({ company: 'Scale AI', role: 'ML Research Engineer', status: 'Rejected', dateApplied: '2025-01-08', lastStatusUpdate: '2025-01-22', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', rejectionReason: 'Position filled internally', confidenceLevel: 50, workMode: 'Hybrid', location: 'San Francisco, CA', statusHistory: [{ status: 'Applied', date: '2025-01-08' }, { status: 'Rejected', date: '2025-01-22' }] }),
      app({ company: 'Stability AI', role: 'Diffusion Models Engineer', status: 'Ghosted', dateApplied: '2024-12-20', lastStatusUpdate: '2024-12-20', source: 'AngelList', priority: 'Low', targetType: 'Stretch', companyType: 'Startup', confidenceLevel: 40, workMode: 'Remote', location: 'London, UK', statusHistory: [{ status: 'Applied', date: '2024-12-20' }, { status: 'Ghosted', date: '2025-01-20' }] }),
      app({ company: 'Nvidia', role: 'Deep Learning Engineer', status: 'Hiring Manager', dateApplied: '2025-01-12', lastStatusUpdate: '2025-02-12', source: 'Recruiter', priority: 'High', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'ML Research v2', confidenceLevel: 70, workMode: 'Hybrid', location: 'Santa Clara, CA', salaryRange: '$180k-$280k', statusHistory: [{ status: 'Applied', date: '2025-01-12' }, { status: 'Phone Screen', date: '2025-01-30' }, { status: 'Hiring Manager', date: '2025-02-12' }] }),
      app({ company: 'Runway ML', role: 'Generative AI Engineer', status: 'Applied', dateApplied: '2025-02-05', source: 'Company Site', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', resumeVersion: 'ML Eng General', confidenceLevel: 55, workMode: 'Remote', location: 'New York, NY' }),
      app({ company: 'Weights & Biases', role: 'ML Platform Engineer', status: 'Applied', dateApplied: '2025-02-06', source: 'LinkedIn', priority: 'Low', targetType: 'Realistic', companyType: 'Startup', resumeVersion: 'ML Eng General', confidenceLevel: 50, workMode: 'Remote', location: 'San Francisco, CA' }),
      app({ company: 'Character AI', role: 'LLM Fine-Tuning Engineer', status: 'Saved', dateSaved: '2025-02-07', dateApplied: '2025-02-07', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', confidenceLevel: 45, workMode: 'Onsite', location: 'Palo Alto, CA' }),
      app({ company: 'Snap Inc', role: 'ML Engineer - AR', status: 'Preparing', dateSaved: '2025-02-04', dateApplied: '2025-02-04', source: 'Glassdoor', priority: 'Low', targetType: 'Realistic', companyType: 'Enterprise', confidenceLevel: 40, workMode: 'Hybrid', location: 'Los Angeles, CA' }),
      app({ company: 'Mistral AI', role: 'LLM Infrastructure Engineer', status: 'Offer', dateApplied: '2025-01-05', lastStatusUpdate: '2025-02-14', source: 'Referral', priority: 'High', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'ML Research v2', confidenceLevel: 90, referral: true, referralStatus: 'Strong reference', workMode: 'Remote', location: 'Paris, FR', salaryRange: '$170k-$250k', statusHistory: [{ status: 'Applied', date: '2025-01-05' }, { status: 'Phone Screen', date: '2025-01-18' }, { status: 'Technical Interview', date: '2025-01-28' }, { status: 'Final Round', date: '2025-02-07' }, { status: 'Offer', date: '2025-02-14' }] }),
      app({ company: 'Databricks', role: 'ML Engineer', status: 'Final Round', dateApplied: '2025-01-18', lastStatusUpdate: '2025-02-11', source: 'Recruiter', priority: 'High', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'ML Research v2', confidenceLevel: 80, workMode: 'Hybrid', location: 'San Francisco, CA', salaryRange: '$190k-$300k', interviewDate: '2025-02-16', statusHistory: [{ status: 'Applied', date: '2025-01-18' }, { status: 'OA', date: '2025-01-28' }, { status: 'Phone Screen', date: '2025-02-04' }, { status: 'Final Round', date: '2025-02-11' }] }),
      app({ company: 'Adobe', role: 'Applied Scientist - GenAI', status: 'Case Study', dateApplied: '2025-01-22', lastStatusUpdate: '2025-02-09', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Enterprise', resumeVersion: 'ML Eng General', confidenceLevel: 65, workMode: 'Hybrid', location: 'San Jose, CA', statusHistory: [{ status: 'Applied', date: '2025-01-22' }, { status: 'Phone Screen', date: '2025-02-02' }, { status: 'Case Study', date: '2025-02-09' }] }),
      app({ company: 'Samsung Research', role: 'ML Researcher', status: 'Withdrawn', dateApplied: '2025-01-03', lastStatusUpdate: '2025-02-01', source: 'Indeed', priority: 'Low', targetType: 'Backup', companyType: 'Enterprise', confidenceLevel: 35, workMode: 'Onsite', location: 'Seoul, KR', outcomeNotes: 'Withdrew after receiving Mistral offer', statusHistory: [{ status: 'Applied', date: '2025-01-03' }, { status: 'OA', date: '2025-01-15' }, { status: 'Withdrawn', date: '2025-02-01' }] }),
      app({ company: 'Amazon AGI', role: 'Applied Scientist', status: 'Panel Interview', dateApplied: '2025-01-14', lastStatusUpdate: '2025-02-13', source: 'Recruiter', priority: 'High', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'ML Research v2', confidenceLevel: 72, workMode: 'Hybrid', location: 'Seattle, WA', salaryRange: '$200k-$350k', interviewDate: '2025-02-18', statusHistory: [{ status: 'Applied', date: '2025-01-14' }, { status: 'OA', date: '2025-01-24' }, { status: 'Phone Screen', date: '2025-02-03' }, { status: 'Panel Interview', date: '2025-02-13' }] }),
      app({ company: 'Perplexity AI', role: 'Search ML Engineer', status: 'Recruiter Screen', dateApplied: '2025-02-02', lastStatusUpdate: '2025-02-10', source: 'Referral', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'ML Eng General', confidenceLevel: 58, referral: true, workMode: 'Remote', location: 'San Francisco, CA', statusHistory: [{ status: 'Applied', date: '2025-02-02' }, { status: 'Recruiter Screen', date: '2025-02-10' }] }),
      app({ company: 'Allen AI', role: 'Research Engineer', status: 'Applied', dateApplied: '2025-02-08', source: 'Company Site', priority: 'Low', targetType: 'Realistic', companyType: 'Nonprofit', resumeVersion: 'ML Eng General', confidenceLevel: 50, workMode: 'Hybrid', location: 'Seattle, WA' }),
    ],
    resumeVersions: [
      { name: 'ML Research v2', targetAudience: 'AI research labs & LLM teams', description: 'Emphasises publications, transformer architecture work, and research projects', skillsEmphasized: ['PyTorch', 'Transformers', 'LLMs', 'Research'], roleType: 'ML Research', link: '', resumeText: '', atsScore: 82, isTailored: false, createdAt: '2025-01-10' },
      { name: 'ML Eng General', targetAudience: 'ML engineering roles at tech companies', description: 'Production ML focus', skillsEmphasized: ['Python', 'TensorFlow', 'MLOps', 'Kubernetes'], roleType: 'ML Engineering', link: '', resumeText: '', atsScore: 75, isTailored: false, createdAt: '2025-01-12' },
      { name: 'NLP Specialist', targetAudience: 'NLP & language model teams', description: 'NLP pipeline experience', skillsEmphasized: ['NLP', 'BERT', 'spaCy', 'Hugging Face'], roleType: 'NLP', link: '', resumeText: '', atsScore: 70, isTailored: false, createdAt: '2025-01-15' },
      { name: 'GenAI Product', targetAudience: 'GenAI product teams', description: 'Product-oriented ML', skillsEmphasized: ['LangChain', 'RAG', 'Prompt Engineering', 'APIs'], roleType: 'Applied AI', link: '', resumeText: '', atsScore: 68, isTailored: true, createdAt: '2025-01-20' },
    ],
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
      weeklyAppTarget: 4,
    },
    applications: [
      app({ company: 'Spotify', role: 'Data Scientist', status: 'Technical Interview', dateApplied: '2025-01-18', lastStatusUpdate: '2025-02-08', source: 'Referral', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'DS Stats Focus', confidenceLevel: 72, referral: true, workMode: 'Remote' }),
      app({ company: 'Netflix', role: 'Senior Data Analyst', status: 'Phone Screen', dateApplied: '2025-01-22', lastStatusUpdate: '2025-02-05', source: 'LinkedIn', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'DS Stats Focus', confidenceLevel: 65 }),
      app({ company: 'Airbnb', role: 'Analytics Engineer', status: 'Applied', dateApplied: '2025-02-01', source: 'Company Site', priority: 'Medium', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'DS General', confidenceLevel: 55 }),
      app({ company: 'Stripe', role: 'Data Scientist - Payments', status: 'OA', dateApplied: '2025-01-15', lastStatusUpdate: '2025-01-28', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'DS Stats Focus', confidenceLevel: 60 }),
      app({ company: 'Lyft', role: 'Data Scientist', status: 'Rejected', dateApplied: '2025-01-10', lastStatusUpdate: '2025-01-25', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Enterprise', rejectionReason: 'Team hiring freeze', confidenceLevel: 45 }),
      app({ company: 'DoorDash', role: 'ML Engineer', status: 'Applied', dateApplied: '2025-02-03', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Enterprise', resumeVersion: 'DS General', confidenceLevel: 50 }),
      app({ company: 'Instacart', role: 'Data Analyst', status: 'Recruiter Screen', dateApplied: '2025-01-28', lastStatusUpdate: '2025-02-06', source: 'Glassdoor', priority: 'Low', targetType: 'Backup', companyType: 'Enterprise', resumeVersion: 'DS General', confidenceLevel: 55 }),
      app({ company: 'Plaid', role: 'Data Scientist', status: 'Applied', dateApplied: '2025-02-05', source: 'AngelList', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', resumeVersion: 'DS General', confidenceLevel: 50 }),
    ],
    resumeVersions: [
      { name: 'DS Stats Focus', targetAudience: 'Data science teams valuing statistical rigor', description: 'A/B testing, causal inference emphasis', skillsEmphasized: ['Python', 'SQL', 'Statistics', 'A/B Testing'], roleType: 'Data Science', link: '', resumeText: '', atsScore: 78, isTailored: false, createdAt: '2025-01-10' },
      { name: 'DS General', targetAudience: 'General data science roles', description: 'Broad DS skill set', skillsEmphasized: ['Python', 'SQL', 'Pandas', 'Scikit-learn'], roleType: 'Data Science', link: '', resumeText: '', atsScore: 72, isTailored: false, createdAt: '2025-01-12' },
    ],
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
      weeklyAppTarget: 5,
    },
    applications: [
      app({ company: 'Vercel', role: 'Frontend Engineer', status: 'Technical Interview', dateApplied: '2025-01-22', lastStatusUpdate: '2025-02-10', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'React Expert', confidenceLevel: 75, workMode: 'Remote' }),
      app({ company: 'Figma', role: 'UI Engineer', status: 'Phone Screen', dateApplied: '2025-01-25', lastStatusUpdate: '2025-02-06', source: 'Referral', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'React Expert', confidenceLevel: 68, referral: true }),
      app({ company: 'Shopify', role: 'React Developer', status: 'Applied', dateApplied: '2025-02-02', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'FE General', confidenceLevel: 55 }),
      app({ company: 'Linear', role: 'Frontend Engineer', status: 'OA', dateApplied: '2025-01-28', lastStatusUpdate: '2025-02-05', source: 'Company Site', priority: 'Medium', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'React Expert', confidenceLevel: 60 }),
      app({ company: 'Webflow', role: 'Senior Frontend Dev', status: 'Rejected', dateApplied: '2025-01-15', lastStatusUpdate: '2025-01-30', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', rejectionReason: 'Looking for more experience', confidenceLevel: 45 }),
      app({ company: 'Tailwind Labs', role: 'Frontend Engineer', status: 'Recruiter Screen', dateApplied: '2025-02-01', lastStatusUpdate: '2025-02-08', source: 'Company Site', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'FE General', confidenceLevel: 60 }),
    ],
    resumeVersions: [
      { name: 'React Expert', targetAudience: 'React/TypeScript focused teams', description: 'Highlights React ecosystem expertise', skillsEmphasized: ['React', 'TypeScript', 'Next.js', 'Tailwind'], roleType: 'Frontend', link: '', resumeText: '', atsScore: 80, isTailored: false, createdAt: '2025-01-10' },
      { name: 'FE General', targetAudience: 'General frontend roles', description: 'Broad frontend skills', skillsEmphasized: ['JavaScript', 'CSS', 'HTML', 'React'], roleType: 'Frontend', link: '', resumeText: '', atsScore: 72, isTailored: false, createdAt: '2025-01-15' },
    ],
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
      weeklyAppTarget: 4,
    },
    applications: [
      app({ company: 'Stripe', role: 'Backend Engineer', status: 'Technical Interview', dateApplied: '2025-01-12', lastStatusUpdate: '2025-02-08', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'Systems v2', confidenceLevel: 70 }),
      app({ company: 'Cloudflare', role: 'Systems Engineer', status: 'Phone Screen', dateApplied: '2025-01-20', lastStatusUpdate: '2025-02-03', source: 'LinkedIn', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'Systems v2', confidenceLevel: 65 }),
      app({ company: 'Datadog', role: 'Platform Engineer', status: 'Applied', dateApplied: '2025-02-01', source: 'Referral', priority: 'Medium', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'BE General', confidenceLevel: 55, referral: true }),
      app({ company: 'Confluent', role: 'Backend Engineer', status: 'OA', dateApplied: '2025-01-25', lastStatusUpdate: '2025-02-04', source: 'LinkedIn', priority: 'Medium', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'Systems v2', confidenceLevel: 60 }),
      app({ company: 'Render', role: 'API Engineer', status: 'Rejected', dateApplied: '2025-01-08', lastStatusUpdate: '2025-01-20', source: 'AngelList', priority: 'Low', targetType: 'Realistic', companyType: 'Startup', rejectionReason: 'Not enough distributed systems experience', confidenceLevel: 40 }),
      app({ company: 'Railway', role: 'Backend Developer', status: 'Applied', dateApplied: '2025-02-04', source: 'Company Site', priority: 'Low', targetType: 'Realistic', companyType: 'Startup', resumeVersion: 'BE General', confidenceLevel: 50 }),
    ],
    resumeVersions: [
      { name: 'Systems v2', targetAudience: 'Infrastructure & systems teams', description: 'Distributed systems & scalability focus', skillsEmphasized: ['Go', 'Rust', 'PostgreSQL', 'gRPC'], roleType: 'Backend', link: '', resumeText: '', atsScore: 76, isTailored: false, createdAt: '2025-01-08' },
      { name: 'BE General', targetAudience: 'General backend roles', description: 'Broad backend engineering', skillsEmphasized: ['Python', 'Node.js', 'SQL', 'REST APIs'], roleType: 'Backend', link: '', resumeText: '', atsScore: 70, isTailored: false, createdAt: '2025-01-10' },
    ],
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
      weeklyAppTarget: 5,
    },
    applications: [
      app({ company: 'Supabase', role: 'Full Stack Engineer', status: 'Technical Interview', dateApplied: '2025-01-20', lastStatusUpdate: '2025-02-10', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'FS Product', confidenceLevel: 72 }),
      app({ company: 'Retool', role: 'Product Engineer', status: 'Applied', dateApplied: '2025-02-01', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'FS General', confidenceLevel: 55 }),
      app({ company: 'Vercel', role: 'Software Engineer', status: 'Phone Screen', dateApplied: '2025-01-25', lastStatusUpdate: '2025-02-05', source: 'Referral', priority: 'High', targetType: 'Dream', companyType: 'Startup', resumeVersion: 'FS Product', confidenceLevel: 65, referral: true }),
      app({ company: 'Cal.com', role: 'Full Stack Dev', status: 'Rejected', dateApplied: '2025-01-10', lastStatusUpdate: '2025-01-22', source: 'AngelList', priority: 'Low', targetType: 'Realistic', companyType: 'Startup', rejectionReason: 'Role filled', confidenceLevel: 40 }),
    ],
    resumeVersions: [
      { name: 'FS Product', targetAudience: 'Product-focused engineering teams', description: 'Full stack with product impact emphasis', skillsEmphasized: ['React', 'Node.js', 'PostgreSQL', 'TypeScript'], roleType: 'Full Stack', link: '', resumeText: '', atsScore: 75, isTailored: false, createdAt: '2025-01-12' },
      { name: 'FS General', targetAudience: 'General full stack roles', description: 'Broad full stack skills', skillsEmphasized: ['JavaScript', 'Python', 'SQL', 'AWS'], roleType: 'Full Stack', link: '', resumeText: '', atsScore: 68, isTailored: false, createdAt: '2025-01-15' },
    ],
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
      weeklyAppTarget: 3,
    },
    applications: [
      app({ company: 'CrowdStrike', role: 'Security Engineer', status: 'Phone Screen', dateApplied: '2025-01-15', lastStatusUpdate: '2025-02-03', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'SecEng v1', confidenceLevel: 65 }),
      app({ company: 'Wiz', role: 'Cloud Security Engineer', status: 'Applied', dateApplied: '2025-02-01', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Startup', resumeVersion: 'SecEng v1', confidenceLevel: 55 }),
      app({ company: 'Snyk', role: 'AppSec Engineer', status: 'Rejected', dateApplied: '2025-01-08', lastStatusUpdate: '2025-01-22', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Startup', rejectionReason: 'Position on hold', confidenceLevel: 45 }),
    ],
    resumeVersions: [
      { name: 'SecEng v1', targetAudience: 'Security engineering teams', description: 'Focus on threat modeling & secure architecture', skillsEmphasized: ['AWS Security', 'OWASP', 'Burp Suite', 'Terraform'], roleType: 'Security', link: '', resumeText: '', atsScore: 74, isTailored: false, createdAt: '2025-01-05' },
    ],
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
      weeklyAppTarget: 4,
    },
    applications: [
      app({ company: 'HashiCorp', role: 'Cloud Engineer', status: 'Technical Interview', dateApplied: '2025-01-18', lastStatusUpdate: '2025-02-08', source: 'Company Site', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'Cloud v1', confidenceLevel: 70 }),
      app({ company: 'Datadog', role: 'SRE', status: 'Applied', dateApplied: '2025-02-02', source: 'LinkedIn', priority: 'Medium', targetType: 'Stretch', companyType: 'Enterprise', resumeVersion: 'Cloud v1', confidenceLevel: 55 }),
      app({ company: 'GitLab', role: 'DevOps Engineer', status: 'Rejected', dateApplied: '2025-01-10', lastStatusUpdate: '2025-01-25', source: 'Company Site', priority: 'Medium', targetType: 'Realistic', companyType: 'Enterprise', rejectionReason: 'Role cancelled', confidenceLevel: 45 }),
    ],
    resumeVersions: [
      { name: 'Cloud v1', targetAudience: 'Cloud infrastructure teams', description: 'AWS/GCP/Kubernetes expertise', skillsEmphasized: ['AWS', 'Terraform', 'Kubernetes', 'Docker'], roleType: 'Cloud/DevOps', link: '', resumeText: '', atsScore: 76, isTailored: false, createdAt: '2025-01-08' },
    ],
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
      weeklyAppTarget: 4,
    },
    applications: [
      app({ company: 'Notion', role: 'Product Manager', status: 'Case Study', dateApplied: '2025-01-18', lastStatusUpdate: '2025-02-08', source: 'Referral', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'PM v1', confidenceLevel: 68, referral: true }),
      app({ company: 'Figma', role: 'Technical PM', status: 'Applied', dateApplied: '2025-02-01', source: 'LinkedIn', priority: 'High', targetType: 'Dream', companyType: 'Enterprise', resumeVersion: 'PM v1', confidenceLevel: 55 }),
      app({ company: 'Slack', role: 'Growth PM', status: 'Rejected', dateApplied: '2025-01-10', lastStatusUpdate: '2025-01-25', source: 'LinkedIn', priority: 'Medium', targetType: 'Realistic', companyType: 'Enterprise', rejectionReason: 'Looking for more PM experience', confidenceLevel: 42 }),
    ],
    resumeVersions: [
      { name: 'PM v1', targetAudience: 'Product teams at tech companies', description: 'Impact-driven PM with technical background', skillsEmphasized: ['Product Strategy', 'SQL', 'A/B Testing', 'User Research'], roleType: 'Product Management', link: '', resumeText: '', atsScore: 72, isTailored: false, createdAt: '2025-01-08' },
    ],
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