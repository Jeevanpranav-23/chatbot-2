import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { 
  Code, 
  Play, 
  Copy, 
  Download, 
  Zap, 
  Bug, 
  Lightbulb, 
  Sparkles,
  Terminal,
  FileCode,
  Settings,
  Loader
} from 'lucide-react';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const App = () => {
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [requestType, setRequestType] = useState('generate');
  const [codeInput, setCodeInput] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('input');

  useEffect(() => {
    fetchSupportedLanguages();
    fetchHistory();
  }, []);

  const fetchSupportedLanguages = async () => {
    try {
      const response = await axios.get(`${API}/supported-languages`);
      setSupportedLanguages(response.data.languages);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/code-history?limit=10`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/generate-code`, {
        prompt,
        language,
        request_type: requestType,
        code_input: requestType !== 'generate' ? codeInput : null
      });
      
      setGeneratedCode(response.data.generated_code);
      setExplanation(response.data.explanation);
      setActiveTab('output');
      fetchHistory(); // Refresh history
    } catch (error) {
      console.error('Error generating code:', error);
      setGeneratedCode('// Error generating code. Please try again.');
      setExplanation('Failed to generate code. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDebug = async () => {
    if (!codeInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/debug-code`, {
        code: codeInput,
        language,
        error_message: prompt
      });
      
      setGeneratedCode(response.data.fixed_code);
      setExplanation(response.data.explanation);
      setActiveTab('output');
    } catch (error) {
      console.error('Error debugging code:', error);
      setGeneratedCode('// Error debugging code. Please try again.');
      setExplanation('Failed to debug code. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    if (!codeInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/optimize-code`, {
        code: codeInput,
        language,
        optimization_type: 'performance'
      });
      
      setGeneratedCode(response.data.optimized_code);
      setExplanation(response.data.explanation);
      setActiveTab('output');
    } catch (error) {
      console.error('Error optimizing code:', error);
      setGeneratedCode('// Error optimizing code. Please try again.');
      setExplanation('Failed to optimize code. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleExplain = async () => {
    if (!codeInput.trim()) return;
    
    setLoading(true);
    try {
      const response = await axios.post(`${API}/explain-code`, {
        code: codeInput,
        language
      });
      
      setGeneratedCode(codeInput);
      setExplanation(response.data.explanation);
      setActiveTab('output');
    } catch (error) {
      console.error('Error explaining code:', error);
      setExplanation('Failed to explain code. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadCode = (code, filename) => {
    const element = document.createElement('a');
    const file = new Blob([code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const getLanguageExtension = (lang) => {
    const langMap = {
      javascript: '.js',
      typescript: '.ts',
      python: '.py',
      react: '.jsx',
      html: '.html',
      css: '.css',
      sql: '.sql',
      json: '.json',
      bash: '.sh',
      nodejs: '.js',
      php: '.php',
      java: '.java',
      csharp: '.cs',
      go: '.go',
      rust: '.rs'
    };
    return langMap[lang] || '.txt';
  };

  const quickPrompts = [
    'Create a React component with state management',
    'Build a REST API endpoint with error handling',
    'Write a function to sort an array',
    'Create a responsive navigation bar',
    'Generate a database schema for a blog',
    'Build a login form with validation',
    'Create a utility function for data formatting',
    'Write a async function with proper error handling'
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Code className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                CodeCraft
              </h1>
              <p className="text-gray-400 text-sm">AI-Powered Code Generation & Debugging</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {supportedLanguages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Action Buttons */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setRequestType('generate')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              requestType === 'generate'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate</span>
          </button>
          
          <button
            onClick={() => setRequestType('debug')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              requestType === 'debug'
                ? 'bg-red-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Bug className="w-4 h-4" />
            <span>Debug</span>
          </button>
          
          <button
            onClick={() => setRequestType('optimize')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              requestType === 'optimize'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Optimize</span>
          </button>
          
          <button
            onClick={() => setRequestType('explain')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              requestType === 'explain'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <Lightbulb className="w-4 h-4" />
            <span>Explain</span>
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-300">Quick Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {quickPrompts.map((qPrompt, index) => (
              <button
                key={index}
                onClick={() => setPrompt(qPrompt)}
                className="text-left p-3 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                {qPrompt}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Section */}
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <Terminal className="w-5 h-5" />
                <span>Input</span>
              </h2>
              
              {/* Prompt Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {requestType === 'generate' ? 'Describe what you want to build:' : 
                   requestType === 'debug' ? 'Describe the issue or error:' :
                   requestType === 'optimize' ? 'What would you like to optimize:' :
                   'What would you like to understand:'}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    requestType === 'generate' ? 'e.g., Create a React component that displays a list of users with pagination' :
                    requestType === 'debug' ? 'e.g., This function is throwing a TypeError when called with null' :
                    requestType === 'optimize' ? 'e.g., This function is running slowly with large datasets' :
                    'e.g., Explain how this algorithm works'
                  }
                  rows={4}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Code Input (for debug, optimize, explain) */}
              {requestType !== 'generate' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Code to {requestType}:
                  </label>
                  <textarea
                    value={codeInput}
                    onChange={(e) => setCodeInput(e.target.value)}
                    placeholder="Paste your code here..."
                    rows={12}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                  />
                </div>
              )}

              {/* Action Button */}
              <button
                onClick={
                  requestType === 'generate' ? handleGenerate :
                  requestType === 'debug' ? handleDebug :
                  requestType === 'optimize' ? handleOptimize :
                  handleExplain
                }
                disabled={loading || !prompt.trim() || (requestType !== 'generate' && !codeInput.trim())}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    <span>
                      {requestType === 'generate' ? 'Generate Code' :
                       requestType === 'debug' ? 'Debug Code' :
                       requestType === 'optimize' ? 'Optimize Code' :
                       'Explain Code'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center space-x-2">
                  <FileCode className="w-5 h-5" />
                  <span>Output</span>
                </h2>
                
                {generatedCode && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => copyToClipboard(generatedCode)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => downloadCode(generatedCode, `code${getLanguageExtension(language)}`)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                      title="Download code"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Code Output */}
              {generatedCode ? (
                <div className="mb-4">
                  <div className="bg-gray-900 rounded-lg overflow-hidden">
                    <SyntaxHighlighter
                      language={language}
                      style={vscDarkPlus}
                      customStyle={{
                        margin: 0,
                        padding: '1rem',
                        background: 'rgb(17 24 39)',
                        fontSize: '14px'
                      }}
                      showLineNumbers
                    >
                      {generatedCode}
                    </SyntaxHighlighter>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-400 py-12">
                  <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generated code will appear here</p>
                </div>
              )}

              {/* Explanation */}
              {explanation && (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-300 mb-2">Explanation:</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{explanation}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 text-gray-300">Recent Generations</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setPrompt(item.prompt);
                    setLanguage(item.language);
                    setRequestType(item.request_type);
                    if (item.code_input) setCodeInput(item.code_input);
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">
                      {item.language}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(item.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">{item.prompt}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;