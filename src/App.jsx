import React, { useState, useEffect } from "react";
import {
  Calendar,
  TrendingUp,
  Sparkles,
  BookOpen,
  BarChart3,
  Heart,
  Brain,
  Zap,
} from "lucide-react";

const JournalApp = () => {
  const [entries, setEntries] = useState([]);
  const [currentEntry, setCurrentEntry] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [insights, setInsights] = useState(null);
  const [view, setView] = useState("write");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  useEffect(() => {
    loadEntries();
    generateDailyPrompt();
  },[]);

  const loadEntries = () => {
    try {
      const data = localStorage.getItem("journal-entries");
      if (data) {
        setEntries(JSON.parse(data));
      }
    } catch (error) {
      console.log("No previous entries found");
    }
  };

  const saveEntries = (updatedEntries) => {
    try {
      localStorage.setItem("journal-entries", JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
    } catch (error) {
      console.error("Error saving entries:", error);
    }
  };

  const generateDailyPrompt = async () => {
    setIsGeneratingPrompt(true);
    try {
      const recentEntries = entries.slice(-5).map((e) => ({
        date: e.date,
        preview: e.content.substring(0, 200),
      }));

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `You are an empathetic journaling companion. Based on these recent journal entries (or lack thereof), generate ONE thoughtful, open-ended prompt to encourage reflection today. Make it warm, specific, and non-judgmental.

              Recent entries: ${
                recentEntries.length > 0
                  ? JSON.stringify(recentEntries)
                  : "No recent entries - this might be their first time journaling"
              }

              Return only the prompt, nothing else.`,
            },
          ],
        }),
      });

      const data = await response.json();
      const prompt =
        data.content.find((c) => c.type === "text")?.text ||
        "What is on your mind today?";
      setAiPrompt(prompt);
    } catch (error) {
      console.error("Error generating prompt:", error);
      setAiPrompt(
        "How are you feeling right now? What brought you here today?"
      );
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const saveEntry = () => {
    if (!currentEntry.trim()) return;

    const newEntry = {
      id: Date.now(),
      date: selectedDate,
      content: currentEntry,
      timestamp: new Date().toISOString(),
    };

    const updatedEntries = [...entries, newEntry];
    saveEntries(updatedEntries);
    setCurrentEntry("");
  };

  const analyzeEntries = async () => {
    if (entries.length === 0) return;

    setIsAnalyzing(true);
    try {
      const recentEntries = entries.slice(-30);

      const response = await fetch("/api/claude", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [
            {
              role: "user",
              content: `Analyze these journal entries and provide insights. Return ONLY valid JSON with no markdown formatting:

                        {
                          "overallSentiment": "positive/neutral/mixed",
                          "dominantEmotions": ["emotion1", "emotion2", "emotion3"],
                          "recurringThemes": ["theme1", "theme2", "theme3"],
                          "patterns": "2-3 sentence observation about patterns",
                          "encouragement": "2-3 sentence encouraging reflection"
                        }

                        Entries: ${JSON.stringify(
                          recentEntries.map((e) => ({
                            date: e.date,
                            content: e.content,
                          }))
                        )}`,
            },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content.find((c) => c.type === "text")?.text || "{}";
      const cleanText = text.replace(/```json|```/g, "").trim();
      const analysis = JSON.parse(cleanText);
      setInsights(analysis);
    } catch (error) {
      console.error("Error analyzing entries:", error);
      setInsights({
        overallSentiment: "neutral",
        dominantEmotions: ["reflective"],
        recurringThemes: ["daily life"],
        patterns:
          "Keep writing to discover patterns in your thoughts and feelings.",
        encouragement:
          "Your journal is a safe space for growth and self-discovery.",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getEntriesByDate = () => {
    const grouped = {};
    entries.forEach((entry) => {
      if (!grouped[entry.date]) {
        grouped[entry.date] = [];
      }
      grouped[entry.date].push(entry);
    });
    return grouped;
  };

  const entriesByDate = getEntriesByDate();
  const sortedDates = Object.keys(entriesByDate).sort().reverse();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-blue-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-900 mb-2 flex items-center justify-center gap-3">
            Nomi
          </h1>
          <p className="text-green-600">time to know me</p>
        </header>

        <nav className="flex gap-2 mb-8 bg-white rounded-xl p-2 shadow-lg">
          <button
            onClick={() => setView("write")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              view === "write"
                ? "bg-green-600 text-white shadow-md"
                : "text-green-600 hover:bg-green-50"
            }`}
          >
            <BookOpen className="w-5 h-5 inline mr-2" />
            Write
          </button>
          <button
            onClick={() => setView("history")}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              view === "history"
                ? "bg-green-600 text-white shadow-md"
                : "text-green-600 hover:bg-green-50"
            }`}
          >
            <Calendar className="w-5 h-5 inline mr-2" />
            History
          </button>
          <button
            onClick={() => {
              setView("insights");
              if (!insights) analyzeEntries();
            }}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              view === "insights"
                ? "bg-green-600 text-white shadow-md"
                : "text-green-600 hover:bg-green-50"
            }`}
          >
            <TrendingUp className="w-5 h-5 inline mr-2" />
            Insights
          </button>
        </nav>

        {view === "write" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xl border-2 border-green-100">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-green-900 mb-2">
                    Today's Prompt
                  </h3>
                  {isGeneratingPrompt ? (
                    <p className="text-green-600 italic animate-pulse">
                      Generating a thoughtful prompt...
                    </p>
                  ) : (
                    <p className="text-green-700 leading-relaxed">{aiPrompt}</p>
                  )}
                </div>
                <button
                  onClick={generateDailyPrompt}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  New Prompt
                </button>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="px-4 py-2 border-2 border-green-200 rounded-lg focus:outline-none focus:border-green-500"
                />
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Brain className="w-4 h-4" />
                  <span>{currentEntry.length} characters</span>
                </div>
              </div>

              <textarea
                value={currentEntry}
                onChange={(e) => setCurrentEntry(e.target.value)}
                placeholder="Start writing... your thoughts are safe here."
                className="w-full h-64 p-4 border-2 border-green-200 rounded-xl focus:outline-none focus:border-green-500 resize-none text-green-900 leading-relaxed"
              />

              <div className="mt-4 flex justify-end">
                <button
                  onClick={saveEntry}
                  disabled={!currentEntry.trim()}
                  className="px-8 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                >
                  Save Entry
                </button>
              </div>
            </div>
          </div>
        )}

        {view === "history" && (
          <div className="bg-white rounded-2xl p-6 shadow-xl">
            <h2 className="text-2xl font-bold text-green-900 mb-6">
              Your Journey
            </h2>

            {entries.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-green-300 mx-auto mb-4" />
                <p className="text-green-600 text-lg">
                  No entries yet. Start your journaling journey today!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map((date) => (
                  <div key={date} className="border-l-4 border-green-300 pl-4">
                    <h3 className="font-semibold text-green-900 mb-3">
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-US",
                        {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </h3>
                    {entriesByDate[date].map((entry) => (
                      <div
                        key={entry.id}
                        className="bg-green-50 rounded-lg p-4 mb-3"
                      >
                        <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
                          {entry.content}
                        </p>
                        <p className="text-xs text-green-500 mt-2">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "insights" && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-green-900">
                  Your Insights
                </h2>
                <button
                  onClick={analyzeEntries}
                  disabled={isAnalyzing || entries.length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all"
                >
                  {isAnalyzing ? "Analyzing..." : "Refresh Analysis"}
                </button>
              </div>

              {entries.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-green-300 mx-auto mb-4" />
                  <p className="text-green-600 text-lg">
                    Write a few entries to unlock personalized insights!
                  </p>
                </div>
              ) : isAnalyzing ? (
                <div className="text-center py-12">
                  <Zap className="w-16 h-16 text-green-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-green-600 text-lg">
                    Analyzing your journal entries...
                  </p>
                </div>
              ) : insights ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-xl p-6">
                      <h3 className="font-semibold text-green-900 mb-2">
                        Overall Sentiment
                      </h3>
                      <p className="text-2xl font-bold text-green-700 capitalize">
                        {insights.overallSentiment}
                      </p>
                    </div>

                    <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-xl p-6">
                      <h3 className="font-semibold text-pink-900 mb-2">
                        Dominant Emotions
                      </h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {insights.dominantEmotions.map((emotion, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-pink-300 text-pink-900 rounded-full text-sm font-medium"
                          >
                            {emotion}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-6">
                      <h3 className="font-semibold text-blue-900 mb-2">
                        Total Entries
                      </h3>
                      <p className="text-2xl font-bold text-blue-700">
                        {entries.length}
                      </p>
                    </div>
                  </div>

                  <div className="bg-purple-50 rounded-xl p-6">
                    <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Recurring Themes
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.recurringThemes.map((theme, idx) => (
                        <span
                          key={idx}
                          className="px-4 py-2 bg-purple-200 text-purple-900 rounded-lg font-medium"
                        >
                          {theme}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-6">
                    <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                      <Brain className="w-5 h-5" />
                      Patterns Observed
                    </h3>
                    <p className="text-blue-800 leading-relaxed">
                      {insights.patterns}
                    </p>
                  </div>

                  <div className="bg-pink-50 rounded-xl p-6">
                    <h3 className="font-semibold text-pink-900 mb-3 flex items-center gap-2">
                      <Heart className="w-5 h-5" />
                      Encouragement
                    </h3>
                    <p className="text-pink-800 leading-relaxed">
                      {insights.encouragement}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-purple-600">
                    Click "Refresh Analysis" to see your insights
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="mt-12 text-center text-sm text-purple-600">
          <p className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            All data stored privately in your browser
          </p>
        </footer>
      </div>
    </div>
  );
};

export default JournalApp;
