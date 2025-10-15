import { useState } from 'react';
import { MessageSquare, SendHorizonal, Loader2 } from 'lucide-react';
import type { Forum, User } from '../../types/course';
import { getRelativeTime } from '../../utils/courseUtils';

interface ForumSectionProps {
  forums: Forum[];
  currentUser: User | null;
  isVisible: boolean;
  onCreateForum: (message: string) => Promise<void>;
}

export default function ForumSection({ forums, currentUser, isVisible, onCreateForum }: ForumSectionProps) {
  const [message, setMessage] = useState("");
  const [forumSubmitting, setForumSubmitting] = useState(false);

  const isFormValid = message.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || !currentUser) return;

    setForumSubmitting(true);
    try {
      await onCreateForum(message);
      setMessage(""); // Clear form on success
    } catch (error) {
      // Error handling is done by parent component or onCreateForum callback
      // Component continues to function normally
    } finally {
      setForumSubmitting(false);
    }
  };

  return (
    <section 
      className={`bg-white/5 backdrop-blur-lg rounded-xl p-6 border border-white/10 mb-8 transition-all duration-1000 delay-600 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
      }`} 
      role="region" 
      aria-labelledby="forum-heading"
    >
      <h2 
        id="forum-heading" 
        className="text-white font-semibold text-xl mb-4 flex items-center gap-2"
      >
        <MessageSquare size={20} className="text-green-400" aria-hidden="true" /> 
        Forum Discussion
      </h2>

      <form onSubmit={handleSubmit} className="mb-6" data-testid="forum-form">
        <div className="relative">
          <label htmlFor="forum-message" className="sr-only">
            Write your forum message
          </label>
          <textarea 
            id="forum-message"
            rows={4} 
            value={message} 
            onChange={(e) => setMessage(e.target.value)} 
            placeholder="Write your message..." 
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all duration-200 resize-vertical min-h-[100px]"
            aria-describedby={!isFormValid && message.length > 0 ? "forum-error" : "forum-help"}
            maxLength={500}
          />
          {!isFormValid && message.length > 0 && (
            <p id="forum-error" className="text-red-400 text-sm mt-1" role="alert">
              Message cannot be empty
            </p>
          )}
          <p id="forum-help" className="text-gray-400 text-sm mt-1">
            {message.length}/500 characters
          </p>
        </div>
        <button 
          type="submit"
          disabled={forumSubmitting || !isFormValid} 
          className="mt-3 flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600 text-white px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-400 transition-all duration-200 min-w-[120px]"
          aria-label="Post message to forum"
        >
          {forumSubmitting ? (
            <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          ) : (
            <SendHorizonal size={16} aria-hidden="true" />
          )} 
          {forumSubmitting ? "Posting..." : "Post"}
        </button>
      </form>

      <div className="space-y-4" role="feed" aria-label="Forum messages" aria-live="polite">
        {forums.length === 0 && (
          <div className="text-center py-8 bg-white/5 rounded-lg">
            <MessageSquare size={48} className="text-gray-600 mx-auto mb-4" aria-hidden="true" />
            <p className="text-gray-400 text-lg">No messages yet.</p>
            <p className="text-gray-500 text-sm mt-1">Start the conversation!</p>
          </div>
        )}

        {forums.map((msg, i) => (
          <article 
            key={i} 
            className="flex items-start gap-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 p-4 rounded-lg border border-white/10 text-white hover:from-purple-500/15 hover:to-cyan-500/15 transition-all duration-200" 
            role="article"
          >
            {/* Avatar */}
            <img
              src={msg.author.avatar}
              alt={`${msg.author.name}'s avatar`}
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10"
              loading="lazy"
            />

            {/* Message Content */}
            <div className="flex-1 min-w-0">
              {/* Header with name and time */}
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold truncate">{msg.author.name}</h3>
                <time className="text-sm text-white/50 flex-shrink-0 ml-2" dateTime={msg.createdAt}>
                  {getRelativeTime(msg.createdAt)}
                </time>
              </div>

              {/* Message Body */}
              <p className="text-white break-words">{msg.content}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}