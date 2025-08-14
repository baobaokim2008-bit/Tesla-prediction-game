'use client';

interface Props {
  username: string;
  onLogout: () => void;
}

export function UserProfile({ username, onLogout }: Props) {
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {username.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <div className="text-white font-semibold">{username}</div>
            <div className="text-xs text-gray-400">Logged in</div>
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="px-3 py-1 text-sm text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
