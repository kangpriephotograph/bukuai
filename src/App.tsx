/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { GoogleGenAI } from "@google/genai";
import { motion, AnimatePresence } from "motion/react";
import { 
  BookOpen, 
  Download, 
  Image as ImageIcon, 
  Layout, 
  Loader2, 
  Sparkles,
  GraduationCap,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface GeneratedData {
  materi: string;
  illustrationUrl: string;
  coverUrl: string;
}

export default function App() {
  const [subject, setSubject] = useState("");
  const [theme, setTheme] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [data, setData] = useState<GeneratedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateBahanAjar = async () => {
    if (!subject || !theme) return;

    setIsGenerating(true);
    setError(null);
    setData(null);

    try {
      // 1. Generate Teaching Material Text (No Bold)
      const textResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Buatkan materi pembelajaran lengkap untuk mata pelajaran "${subject}" dengan tema "${theme}". 
        PENTING: Jangan gunakan efek tebal (bold) atau tanda bintang (**) dalam teks. Gunakan bahasa Indonesia yang formal dan mudah dipahami. 
        Struktur materi: Pendahuluan, Isi Materi, dan Kesimpulan.`,
      });

      const materiText = textResponse.text || "Gagal menghasilkan materi.";

      // 2. Generate Illustration Image
      const illustrationResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: `An educational illustration for the subject "${subject}" with the theme "${theme}". Clean, professional, and suitable for students. 2D vector style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      let illustrationUrl = "";
      for (const part of illustrationResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          illustrationUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      // 3. Generate Cover Image
      const coverResponse = await ai.models.generateContent({
        model: "gemini-2.5-flash-image",
        contents: {
          parts: [{ text: `A book cover for "${subject}" titled "${theme}". The title should be at the top, and below it, an illustration representing the theme. Professional textbook style.` }],
        },
        config: {
          imageConfig: {
            aspectRatio: "3:4",
          }
        }
      });

      let coverUrl = "";
      for (const part of coverResponse.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          coverUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      setData({
        materi: materiText,
        illustrationUrl,
        coverUrl,
      });
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan saat generate. Pastikan API Key sudah benar.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadDoc = () => {
    if (!data) return;
    
    // Create a simple HTML structure for the doc
    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>${theme}</title>
      <style>
        body, h1, h2, h3, p { font-family: 'Arial', sans-serif; font-weight: normal !important; }
        h1 { font-size: 24pt; }
        h2 { font-size: 18pt; }
      </style>
      </head>
      <body>
        <h1 style="font-weight: normal;">Mata Pelajaran: ${subject}</h1>
        <h2 style="font-weight: normal;">Tema: ${theme}</h2>
        <br/>
        <div style="font-weight: normal;">${data.materi.replace(/\n/g, '<br/>')}</div>
      </body>
      </html>
    `;
    
    const blob = new Blob(['\ufeff', content], {
      type: 'application/msword'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${theme.replace(/\s+/g, '_')}_Materi.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadImage = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-cyan-600/10 rounded-full blur-[100px]"></div>
        <div className="absolute -bottom-[10%] left-[20%] w-[35%] h-[35%] bg-blue-600/15 rounded-full blur-[110px]"></div>
      </div>

      {/* Header */}
      <header className="bg-slate-950/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-xl shadow-lg shadow-cyan-500/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Bahan Ajar <span className="text-cyan-400">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="bg-slate-900/50 text-cyan-400 border-cyan-500/30 px-3 py-1">
              <Sparkles className="w-3 h-3 mr-1.5" />
              AI Powered
            </Badge>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Input Section */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-800 shadow-2xl overflow-hidden">
              <CardHeader className="bg-slate-900/60 border-b border-slate-800">
                <CardTitle className="text-lg flex items-center gap-2 text-white">
                  <Layout className="w-5 h-5 text-cyan-400" />
                  Menu Utama
                </CardTitle>
                <CardDescription className="text-slate-400">Atur parameter bahan ajar Anda.</CardDescription>
              </CardHeader>
              <CardContent className="pt-8 space-y-6">
                <div className="space-y-3">
                  <Label htmlFor="subject" className="text-slate-300 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-500" />
                    Mata Pelajaran
                  </Label>
                  <Input 
                    id="subject" 
                    placeholder="Contoh: Biologi, Sejarah..." 
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500 h-11"
                  />
                </div>
                <div className="space-y-3">
                  <Label htmlFor="theme" className="text-slate-300 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-500" />
                    Tema Pembelajaran
                  </Label>
                  <Input 
                    id="theme" 
                    placeholder="Contoh: Fotosintesis, Perang Dunia II..." 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="bg-slate-950/50 border-slate-700 text-white placeholder:text-slate-600 focus-visible:ring-cyan-500 h-11"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-slate-900/60 border-t border-slate-800 pt-8 pb-8">
                <Button 
                  onClick={generateBahanAjar} 
                  disabled={isGenerating || !subject || !theme}
                  className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-semibold transition-all shadow-lg shadow-cyan-900/20 h-12 rounded-xl active:scale-95 disabled:opacity-50"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Memproses AI...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Sekarang
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm flex items-start gap-3"
              >
                <div className="p-1 bg-red-500/20 rounded-lg mt-0.5">
                  <Loader2 className="w-4 h-4 rotate-45" />
                </div>
                {error}
              </motion.div>
            )}
          </div>

          {/* Output Section */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {!data && !isGenerating ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-12 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[2rem]"
                >
                  <div className="bg-slate-900/60 p-8 rounded-3xl mb-6 shadow-inner">
                    <BookOpen className="w-16 h-16 text-slate-700" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-300">Siap Membuat Materi?</h3>
                  <p className="text-slate-500 max-w-sm mt-3 leading-relaxed">
                    Masukkan mata pelajaran dan tema di panel kiri untuk menghasilkan bahan ajar berkualitas tinggi secara instan.
                  </p>
                </motion.div>
              ) : isGenerating ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="h-full min-h-[450px] flex flex-col items-center justify-center text-center p-12 bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-[2rem] shadow-2xl"
                >
                  <div className="relative mb-8">
                    <div className="w-24 h-24 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center animate-pulse">
                        <Sparkles className="w-6 h-6 text-cyan-400" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">AI Sedang Bekerja</h3>
                  <p className="text-slate-400 max-w-sm mt-3 leading-relaxed">
                    Kami sedang menyusun materi teks, merancang ilustrasi, dan membuat cover khusus untuk Anda.
                  </p>
                  <div className="mt-8 flex gap-2">
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce"></div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="content"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-8"
                >
                  {/* Text Content */}
                  <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-800 shadow-2xl overflow-hidden rounded-[2rem]">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-8 border-b border-slate-800 bg-slate-900/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-cyan-400" />
                          <CardTitle className="text-xl text-white">Materi Pembelajaran</CardTitle>
                        </div>
                        <CardDescription className="text-slate-400">{subject} • {theme}</CardDescription>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={downloadDoc} 
                        className="bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all rounded-xl px-5"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download DOC
                      </Button>
                    </CardHeader>
                    <CardContent className="p-8">
                      <div className="prose prose-invert max-w-none whitespace-pre-wrap text-slate-300 leading-relaxed text-lg font-light">
                        {data.materi}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Illustration */}
                    <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-800 shadow-2xl overflow-hidden rounded-[2rem] flex flex-col">
                      <CardHeader className="p-6 border-b border-slate-800 bg-slate-900/60">
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                          <ImageIcon className="w-5 h-5 text-cyan-400" />
                          Ilustrasi Tema
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex-grow flex items-center justify-center bg-slate-950/30">
                        {data.illustrationUrl ? (
                          <div className="relative group">
                            <img 
                              src={data.illustrationUrl} 
                              alt="Ilustrasi" 
                              className="rounded-2xl shadow-2xl max-w-full h-auto border border-slate-800 transition-transform duration-500 group-hover:scale-[1.02]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-sm italic flex flex-col items-center gap-2">
                            <ImageIcon className="w-8 h-8 opacity-20" />
                            Gagal memuat gambar
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-6 border-t border-slate-800 bg-slate-900/40">
                        <Button 
                          variant="outline" 
                          className="w-full bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all rounded-xl h-11" 
                          onClick={() => downloadImage(data.illustrationUrl, `${theme}_Ilustrasi.png`)}
                          disabled={!data.illustrationUrl}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Ilustrasi
                        </Button>
                      </CardFooter>
                    </Card>

                    {/* Cover */}
                    <Card className="bg-slate-900/40 backdrop-blur-sm border-slate-800 shadow-2xl overflow-hidden rounded-[2rem] flex flex-col">
                      <CardHeader className="p-6 border-b border-slate-800 bg-slate-900/60">
                        <CardTitle className="text-lg flex items-center gap-2 text-white">
                          <Layout className="w-5 h-5 text-cyan-400" />
                          Cover Buku
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 flex-grow flex items-center justify-center bg-slate-950/30">
                        {data.coverUrl ? (
                          <div className="relative group">
                            <img 
                              src={data.coverUrl} 
                              alt="Cover" 
                              className="rounded-2xl shadow-2xl max-w-full h-auto border border-slate-800 aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none"></div>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-sm italic flex flex-col items-center gap-2">
                            <Layout className="w-8 h-8 opacity-20" />
                            Gagal memuat gambar
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="p-6 border-t border-slate-800 bg-slate-900/40">
                        <Button 
                          variant="outline" 
                          className="w-full bg-slate-950 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-all rounded-xl h-11" 
                          onClick={() => downloadImage(data.coverUrl, `${theme}_Cover.png`)}
                          disabled={!data.coverUrl}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download Cover
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950/80 border-t border-slate-900 py-12 mt-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <GraduationCap className="w-5 h-5 text-cyan-500" />
            <span className="font-bold text-slate-300">Bahan Ajar AI</span>
          </div>
          <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed">
            Platform cerdas untuk membantu pendidik Indonesia menciptakan materi berkualitas dengan teknologi AI tercanggih.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-900/50 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-600 text-xs">© 2026 Bahan Ajar AI. All rights reserved.</p>
            <div className="flex gap-6">
              <span className="text-slate-600 text-xs hover:text-cyan-400 cursor-pointer transition-colors">Kebijakan Privasi</span>
              <span className="text-slate-600 text-xs hover:text-cyan-400 cursor-pointer transition-colors">Syarat & Ketentuan</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
