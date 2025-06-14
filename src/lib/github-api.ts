import type { RepoData } from '@/types';

export async function analyzeRepository(repoUrl: string): Promise<RepoData> {
  // Extract owner and repo name from URL
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) {
    throw new Error('Invalid GitHub repository URL');
  }

  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, '');

  try {
    // Fetch repository information
    const repoResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}`);
    if (!repoResponse.ok) {
      throw new Error('Repository not found or not accessible');
    }
    const repository = await repoResponse.json();

    // Fetch repository contents
    const contentsResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/contents`);
    if (!contentsResponse.ok) {
      throw new Error('Failed to fetch repository contents');
    }
    const contents = await contentsResponse.json();

    // Fetch languages
    const languagesResponse = await fetch(`https://api.github.com/repos/${owner}/${cleanRepo}/languages`);
    const languages = languagesResponse.ok ? await languagesResponse.json() : {};

    // Analyze file structure recursively
    const fileStructure = await analyzeFileStructure(owner, cleanRepo, '', 0);
    
    // Count components and pages
    const stats = analyzeProjectStats(fileStructure);
    
    // Detect technologies
    const technologies = detectTechnologies(fileStructure, Object.keys(languages));

    // Get sample files for analysis
    const sampleFiles = await getSampleFiles(owner, cleanRepo, fileStructure);

    return {
      repository,
      stats,
      languages: Object.keys(languages),
      technologies,
      fileStructure,
      sampleFiles
    };
  } catch (error) {
    throw new Error(`Failed to analyze repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function analyzeFileStructure(owner: string, repo: string, path: string, depth: number): Promise<any[]> {
  if (depth > 3) return []; // Limit recursion depth

  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`);
    if (!response.ok) return [];
    
    const contents = await response.json();
    const files = [];

    for (const item of contents) {
      if (item.type === 'file') {
        files.push({
          name: item.name,
          path: item.path,
          size: item.size,
          type: 'file'
        });
      } else if (item.type === 'dir' && !item.name.startsWith('.') && item.name !== 'node_modules') {
        const subFiles = await analyzeFileStructure(owner, repo, item.path, depth + 1);
        files.push({
          name: item.name,
          path: item.path,
          type: 'directory',
          children: subFiles
        });
      }
    }

    return files;
  } catch {
    return [];
  }
}

function analyzeProjectStats(fileStructure: any[]): any {
  let totalFiles = 0;
  let components = 0;
  let pages = 0;

  function countFiles(files: any[]) {
    for (const file of files) {
      if (file.type === 'file') {
        totalFiles++;
        
        // Count components (React, Vue, Svelte, etc.)
        if (isComponent(file.name, file.path)) {
          components++;
        }
        
        // Count pages
        if (isPage(file.name, file.path)) {
          pages++;
        }
      } else if (file.children) {
        countFiles(file.children);
      }
    }
  }

  countFiles(fileStructure);

  return { totalFiles, components, pages };
}

function isComponent(fileName: string, filePath: string): boolean {
  const componentExtensions = ['.tsx', '.jsx', '.vue', '.svelte'];
  const componentPatterns = [
    /\/components?\//i,
    /\/ui\//i,
    /\/widgets?\//i,
    /\/shared\//i
  ];

  return componentExtensions.some(ext => fileName.endsWith(ext)) &&
         componentPatterns.some(pattern => pattern.test(filePath));
}

function isPage(fileName: string, filePath: string): boolean {
  const pagePatterns = [
    /\/pages?\//i,
    /\/routes?\//i,
    /\/views?\//i,
    /\/screens?\//i,
    /^pages?\//i,
    /app\/.*\.(tsx|jsx|js|ts)$/i
  ];

  return pagePatterns.some(pattern => pattern.test(filePath)) ||
         fileName.toLowerCase().includes('page') ||
         fileName.toLowerCase().includes('route');
}

function detectTechnologies(fileStructure: any[], languages: string[]): string[] {
  const technologies = new Set<string>();
  
  // Add languages
  languages.forEach(lang => technologies.add(lang));

  function analyzeTech(files: any[]) {
    for (const file of files) {
      if (file.type === 'file') {
        const fileName = file.name.toLowerCase();
        const filePath = file.path.toLowerCase();

        // Framework detection
        if (fileName.includes('package.json')) technologies.add('Node.js');
        if (fileName.includes('next.config')) technologies.add('Next.js');
        if (fileName.includes('nuxt.config')) technologies.add('Nuxt.js');
        if (fileName.includes('vue.config')) technologies.add('Vue.js');
        if (fileName.includes('angular.json')) technologies.add('Angular');
        if (fileName.includes('svelte.config')) technologies.add('Svelte');
        if (fileName.includes('vite.config')) technologies.add('Vite');
        if (fileName.includes('webpack.config')) technologies.add('Webpack');
        if (fileName.includes('tailwind.config')) technologies.add('Tailwind CSS');
        if (fileName.includes('postcss.config')) technologies.add('PostCSS');
        if (fileName.includes('tsconfig.json')) technologies.add('TypeScript');
        if (fileName.includes('jest.config')) technologies.add('Jest');
        if (fileName.includes('cypress.config')) technologies.add('Cypress');
        if (fileName.includes('playwright.config')) technologies.add('Playwright');
        if (fileName.includes('docker')) technologies.add('Docker');
        if (fileName.includes('docker-compose')) technologies.add('Docker Compose');
        if (fileName.includes('.env')) technologies.add('Environment Variables');
        if (fileName.includes('prisma')) technologies.add('Prisma');
        if (fileName.includes('supabase')) technologies.add('Supabase');
        if (fileName.includes('firebase')) technologies.add('Firebase');
        if (filePath.includes('graphql')) technologies.add('GraphQL');
        if (fileName.includes('eslint')) technologies.add('ESLint');
        if (fileName.includes('prettier')) technologies.add('Prettier');
        if (fileName.includes('husky')) technologies.add('Husky');
        if (fileName.includes('lint-staged')) technologies.add('Lint Staged');
      } else if (file.children) {
        analyzeTech(file.children);
      }
    }
  }

  analyzeTech(fileStructure);
  return Array.from(technologies);
}

async function getSampleFiles(owner: string, repo: string, fileStructure: any[]): Promise<Array<{path: string, content: string}>> {
  const sampleFiles = [];
  const targetFiles = ['package.json', 'README.md', 'tsconfig.json', 'next.config.js', 'vite.config.ts'];
  
  async function findAndFetchFiles(files: any[]) {
    for (const file of files) {
      if (file.type === 'file' && targetFiles.some(target => file.name.includes(target))) {
        try {
          const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}`);
          if (response.ok) {
            const data = await response.json();
            const content = atob(data.content);
            sampleFiles.push({ path: file.path, content });
          }
        } catch {
          // Ignore errors for individual files
        }
      } else if (file.children) {
        await findAndFetchFiles(file.children);
      }
    }
  }

  await findAndFetchFiles(fileStructure);
  return sampleFiles.slice(0, 5); // Limit to 5 files
}