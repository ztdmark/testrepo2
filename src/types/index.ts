export interface RepoData {
  repository: {
    name: string;
    description: string;
    stargazers_count: number;
    watchers_count: number;
    forks_count: number;
    language: string;
    created_at: string;
    updated_at: string;
  };
  stats: {
    totalFiles: number;
    components: number;
    pages: number;
  };
  languages: string[];
  technologies: string[];
  fileStructure: any[];
  sampleFiles: Array<{
    path: string;
    content: string;
  }>;
}

export interface AnalysisResult {
  summary: string;
  features: string[];
  architecture: {
    pattern: string;
    components: string[];
  };
  insights: {
    codeQuality: string;
    complexity: number;
    performance: string;
  };
  recommendations: string[];
}