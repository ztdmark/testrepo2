import type { RepoData, AnalysisResult } from '@/types';

export async function analyzeWithGemini(repoData: RepoData, apiKey: string): Promise<AnalysisResult> {
  const prompt = createAnalysisPrompt(repoData);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 1,
          topP: 1,
          maxOutputTokens: 2048,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini API Error:', errorData);
      
      if (response.status === 400) {
        throw new Error('Invalid API key or request format. Please check your Gemini API key.');
      } else if (response.status === 403) {
        throw new Error('API key does not have permission to access Gemini API.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`Gemini API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const analysisText = data.candidates[0].content.parts[0].text;
    
    return parseAnalysisResult(analysisText);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Gemini API error: ${error}`);
  }
}

function createAnalysisPrompt(repoData: RepoData): string {
  const { repository, stats, languages, technologies, sampleFiles } = repoData;

  return `
Analyze this GitHub repository and provide a comprehensive analysis in the following JSON format:

{
  "summary": "Brief overview of what this project does and its purpose",
  "features": ["List of main features/functionalities"],
  "architecture": {
    "pattern": "Architecture pattern used (MVC, Component-based, etc.)",
    "components": ["Key architectural components"]
  },
  "insights": {
    "codeQuality": "Assessment of code quality and organization",
    "complexity": 5,
    "performance": "Performance considerations and potential issues"
  },
  "recommendations": ["List of improvement suggestions"]
}

Repository Information:
- Name: ${repository.name}
- Description: ${repository.description || 'No description'}
- Stars: ${repository.stargazers_count}
- Language: ${repository.language}
- Created: ${repository.created_at}
- Last Updated: ${repository.updated_at}

Statistics:
- Total Files: ${stats.totalFiles}
- Components: ${stats.components}
- Pages: ${stats.pages}
- Languages: ${languages.join(', ')}
- Technologies: ${technologies.join(', ')}

Sample File Contents:
${sampleFiles.map(file => `
--- ${file.path} ---
${file.content.substring(0, 1000)}${file.content.length > 1000 ? '...' : ''}
`).join('\n')}

Please provide a thorough analysis focusing on:
1. What the application does and its main purpose
2. Technical architecture and patterns used
3. Code quality and organization
4. Performance considerations
5. Suggestions for improvement

Respond ONLY with valid JSON format.
`;
}

function parseAnalysisResult(analysisText: string): AnalysisResult {
  try {
    // Clean the response to ensure it's valid JSON
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);

    // Validate and provide defaults
    return {
      summary: parsed.summary || 'No summary available',
      features: Array.isArray(parsed.features) ? parsed.features : [],
      architecture: {
        pattern: parsed.architecture?.pattern || 'Unknown',
        components: Array.isArray(parsed.architecture?.components) ? parsed.architecture.components : []
      },
      insights: {
        codeQuality: parsed.insights?.codeQuality || 'No assessment available',
        complexity: Math.max(1, Math.min(10, parsed.insights?.complexity || 5)),
        performance: parsed.insights?.performance || 'No performance notes available'
      },
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : []
    };
  } catch (error) {
    // Fallback analysis if JSON parsing fails
    return {
      summary: 'Analysis completed but could not parse detailed results. The repository appears to be a software project with various files and components.',
      features: ['Code organization', 'File structure', 'Documentation'],
      architecture: {
        pattern: 'Standard project structure',
        components: ['Source files', 'Configuration files', 'Documentation']
      },
      insights: {
        codeQuality: 'Repository structure suggests organized development practices.',
        complexity: 5,
        performance: 'Performance characteristics depend on the specific implementation details.'
      },
      recommendations: [
        'Consider adding more documentation',
        'Ensure proper testing coverage',
        'Optimize build configuration if applicable'
      ]
    };
  }
}