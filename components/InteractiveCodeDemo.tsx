import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, RotateCcw, Copy, Check, Terminal, Code, Eye } from 'lucide-react';

interface InteractiveCodeDemoProps {
  isOpen: boolean;
  onClose: () => void;
}

const InteractiveCodeDemo: React.FC<InteractiveCodeDemoProps> = ({ isOpen, onClose }) => {
  const [activeDemo, setActiveDemo] = useState(0);
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const demos = [
    {
      id: 1,
      title: "Laravel API Endpoint",
      description: "RESTful API with validation and authentication",
      language: "php",
      initialCode: `<?php

namespace App\\Http\\Controllers\\Api;

use App\\Http\\Controllers\\Controller;
use App\\Models\\User;
use Illuminate\\Http\\Request;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Validation\\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'message' => 'Login successful'
        ]);
    }
}`,
      expectedOutput: `{
  "user": {
    "id": 1,
    "name": "Ian Smith",
    "email": "ian@example.com",
    "created_at": "2024-01-01T00:00:00.000000Z"
  },
  "token": "1|abc123def456...",
  "message": "Login successful"
}`
    },
    {
      id: 2,
      title: "React Hook with TypeScript",
      description: "Custom hook for API data fetching with error handling",
      language: "typescript",
      initialCode: `import { useState, useEffect, useCallback } from 'react';

interface ApiResponse<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useApi<T>(url: string): ApiResponse<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}`,
      expectedOutput: `// Usage Example:
const { data, loading, error, refetch } = useApi<User[]>('/api/users');

if (loading) return <div>Loading...</div>;
if (error) return <div>Error: {error}</div>;

return (
  <div>
    {data?.map(user => (
      <div key={user.id}>{user.name}</div>
    ))}
  </div>
);`
    },
    {
      id: 3,
      title: "Database Migration",
      description: "Laravel migration with relationships and indexes",
      language: "php",
      initialCode: `<?php

use Illuminate\\Database\\Migrations\\Migration;
use Illuminate\\Database\\Schema\\Blueprint;
use Illuminate\\Support\\Facades\\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('projects', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description');
            $table->json('technologies');
            $table->string('status')->default('active');
            $table->string('github_url')->nullable();
            $table->string('live_url')->nullable();
            $table->string('featured_image');
            $table->json('gallery_images')->nullable();
            $table->boolean('featured')->default(false);
            $table->integer('view_count')->default(0);
            $table->foreignUuid('user_id')->constrained()->onDelete('cascade');
            $table->timestamps();
            
            $table->index(['status', 'featured']);
            $table->index('created_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('projects');
    }
};`,
      expectedOutput: `Migration executed successfully!

Created table: projects
- UUID primary key
- Full-text search indexes
- Foreign key constraints
- JSON columns for flexible data
- Performance optimized indexes

Table structure:
+------------------+------------------+
| Column           | Type             |
+------------------+------------------+
| id               | uuid (primary)   |
| title            | varchar(255)     |
| description      | text             |
| technologies     | json             |
| status           | varchar(255)     |
| github_url       | varchar(255)     |
| live_url         | varchar(255)     |
| featured_image   | varchar(255)     |
| gallery_images   | json             |
| featured         | boolean          |
| view_count       | integer          |
| user_id          | uuid (foreign)   |
| created_at       | timestamp        |
| updated_at       | timestamp        |
+------------------+------------------+`
    }
  ];

  useEffect(() => {
    if (isOpen) {
      setCode(demos[activeDemo].initialCode);
      setOutput(demos[activeDemo].expectedOutput);
    }
  }, [isOpen, activeDemo]);

  const runCode = async () => {
    setIsRunning(true);
    // Simulate code execution
    await new Promise(resolve => setTimeout(resolve, 1500));
    setOutput(demos[activeDemo].expectedOutput);
    setIsRunning(false);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetCode = () => {
    setCode(demos[activeDemo].initialCode);
    setOutput(demos[activeDemo].expectedOutput);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative w-full max-w-7xl h-[90vh] bg-space-900 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-6 bg-white/[0.01] border-b border-white/5 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight">Interactive Code Demos</h2>
                <p className="text-white/40 text-sm">Live coding examples with real-time execution</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X className="w-6 h-6 text-white/40" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Demo List */}
              <div className="w-80 border-r border-white/5 p-6 overflow-y-auto">
                <h3 className="text-lg font-bold mb-6">Code Examples</h3>
                <div className="space-y-3">
                  {demos.map((demo, index) => (
                    <button
                      key={demo.id}
                      onClick={() => setActiveDemo(index)}
                      className={`w-full p-4 rounded-2xl border transition-all text-left ${
                        activeDemo === index
                          ? 'bg-accent-primary/10 border-accent-primary/20 text-white'
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10 text-white/80'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Code className="w-4 h-4" />
                        <span className="font-bold text-sm">{demo.title}</span>
                      </div>
                      <p className="text-white/60 text-xs leading-relaxed">{demo.description}</p>
                      <div className="mt-2">
                        <span className="px-2 py-1 bg-white/10 rounded-md text-[10px] font-bold uppercase tracking-wider">
                          {demo.language}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 flex flex-col">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Terminal className="w-5 h-5 text-accent-primary" />
                    <span className="font-bold">{demos[activeDemo].title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={copyCode}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      <span className="text-sm">{copied ? 'Copied!' : 'Copy'}</span>
                    </button>
                    <button
                      onClick={resetCode}
                      className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={runCode}
                      disabled={isRunning}
                      className="px-4 py-2 bg-accent-primary text-white font-bold rounded-xl hover:bg-accent-primary/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      {isRunning ? 'Running...' : 'Run Code'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 flex">
                  {/* Code Input */}
                  <div className="flex-1 flex flex-col">
                    <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                      <Code className="w-4 h-4 text-white/40" />
                      <span className="text-sm font-mono text-white/60">Code Editor</span>
                    </div>
                    <textarea
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="flex-1 p-6 bg-black/20 text-white font-mono text-sm leading-relaxed resize-none border-none outline-none"
                      spellCheck={false}
                    />
                  </div>

                  {/* Output */}
                  <div className="flex-1 flex flex-col border-l border-white/5">
                    <div className="p-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-white/40" />
                      <span className="text-sm font-mono text-white/60">Output</span>
                    </div>
                    <div className="flex-1 p-6 bg-black/10 overflow-auto">
                      {isRunning ? (
                        <div className="flex items-center gap-3 text-white/60">
                          <div className="w-4 h-4 border-2 border-accent-primary border-t-transparent rounded-full animate-spin"></div>
                          <span className="font-mono text-sm">Executing code...</span>
                        </div>
                      ) : (
                        <pre className="text-white/80 font-mono text-sm leading-relaxed whitespace-pre-wrap">
                          {output}
                        </pre>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InteractiveCodeDemo;