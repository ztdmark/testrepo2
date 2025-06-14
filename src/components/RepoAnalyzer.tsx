import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Github, 
  Sparkles, 
  FileText, 
  Layers, 
  Code, 
  BarChart3,
  ExternalLink,
  AlertCircle,
  Loader2,
  Eye,
  Star,
  GitFork
} from 'lucide-react';
import { toast } from 'sonner';
import { analyzeRepository } from '@/lib/github-api';
import { analyzeWithGemini } from '@/lib/gemini-api';
import type { RepoData, AnalysisResult } from '@/types';

export default function RepoAnalyzer() {
  const [repoUrl, setRepoUrl] = useState('');
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [repoData, setRepoData] = useState<RepoData | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }

    if (!geminiApiKey.trim()) {
      toast.error('Please enter your Gemini API key');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    try {
      // Step 1: Fetch repository data
      setAnalysisProgress(25);
      toast.info('Fetching repository data...');
      const data = await analyzeRepository(repoUrl);
      setRepoData(data);

      // Step 2: Analyze with Gemini
      setAnalysisProgress(50);
      toast.info('Analyzing code with Gemini AI...');
      const analysis = await analyzeWithGemini(data, geminiApiKey);
      setAnalysisResult(analysis);

      setAnalysisProgress(100);
      toast.success('Analysis completed successfully!');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred during analysis';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setRepoData(null);
    setAnalysisResult(null);
    setError(null);
    setAnalysisProgress(0);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Github className="w-8 h-8 text-blue-600" />
          <Sparkles className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          GitHub Repository Analyzer
        </h1>
        <p className="text-muted-foreground text-lg">
          Analyze your GitHub repositories with AI-powered insights
        </p>
      </div>

      <Card className="mb-8 backdrop-blur-sm bg-white/80 border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="w-5 h-5" />
            Repository Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="repo-url">GitHub Repository URL</Label>
              <Input
                id="repo-url"
                placeholder="https://github.com/username/repository"
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gemini-key" className="flex items-center gap-2">
                Gemini API Key
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                >
                  <ExternalLink className="w-3 h-3" />
                  Get Free Key
                </a>
              </Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="Enter your Gemini API key"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                disabled={isAnalyzing}
              />
            </div>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Analysis Progress</span>
                <span>{analysisProgress}%</span>
              </div>
              <Progress value={analysisProgress} className="w-full" />
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Analyze Repository
                </>
              )}
            </Button>
            {(repoData || analysisResult) && (
              <Button variant="outline" onClick={resetAnalysis}>
                New Analysis
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {repoData && (
        <div className="space-y-6">
          <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Github className="w-5 h-5" />
                Repository Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{repoData.stats.totalFiles}</div>
                  <div className="text-sm text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{repoData.stats.components}</div>
                  <div className="text-sm text-muted-foreground">Components</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{repoData.stats.pages}</div>
                  <div className="text-sm text-muted-foreground">Pages</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{repoData.languages.length}</div>
                  <div className="text-sm text-muted-foreground">Languages</div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{repoData.repository.watchers_count} watchers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{repoData.repository.stargazers_count} stars</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{repoData.repository.forks_count} forks</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {repoData.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Technologies Detected</h4>
                  <div className="flex flex-wrap gap-2">
                    {repoData.technologies.map((tech) => (
                      <Badge key={tech} variant="outline">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {analysisResult && (
            <Card className="backdrop-blur-sm bg-white/80 border-0 shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Analysis Results
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="architecture">Architecture</TabsTrigger>
                    <TabsTrigger value="insights">Insights</TabsTrigger>
                    <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="summary" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Project Overview</h4>
                      <p className="text-muted-foreground leading-relaxed">
                        {analysisResult.summary}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Main Features</h4>
                      <ul className="space-y-1">
                        {analysisResult.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="architecture" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Architecture Pattern</h4>
                      <p className="text-muted-foreground">
                        {analysisResult.architecture.pattern}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Key Components</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {analysisResult.architecture.components.map((component, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                            <Layers className="w-4 h-4 text-blue-600" />
                            <span className="text-sm">{component}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="insights" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Code Quality</h4>
                      <p className="text-muted-foreground">
                        {analysisResult.insights.codeQuality}
                      </p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Complexity Score</h4>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-yellow-500 h-2 rounded-full"
                            style={{ width: `${analysisResult.insights.complexity * 10}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium">{analysisResult.insights.complexity}/10</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Performance Notes</h4>
                      <p className="text-muted-foreground">
                        {analysisResult.insights.performance}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="recommendations" className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">Improvement Suggestions</h4>
                      <ul className="space-y-2">
                        {analysisResult.recommendations.map((rec, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm">{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}