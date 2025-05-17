
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Search, User as UserIcon } from 'lucide-react';
import { d1Database } from '@/lib/d1Database';

interface UserSearchResult {
  id: string;
  username: string;
  profile_image_url?: string;
}

const UserSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Search for users with similar usernames
      const users = await d1Database.searchUsers(searchTerm);
      setResults(users);
      
      if (users.length === 0) {
        setError('No users found matching your search');
      }
    } catch (err: any) {
      console.error('Error searching for users:', err);
      setError(err.message || 'An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const viewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Find Players</h1>

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <Input
          type="text"
          placeholder="Search by username..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <><Search className="h-4 w-4 mr-2" /> Search</>
          )}
        </Button>
      </form>

      {error && (
        <div className="text-center text-red-500 mb-4">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {results.map((user) => (
          <Card key={user.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                  {user.profile_image_url ? (
                    <img
                      src={user.profile_image_url}
                      alt={user.username}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserIcon className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewProfile(user.id)}
                >
                  View Profile
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {results.length > 0 && (
        <p className="text-center text-sm text-gray-500 mt-6">
          Showing {results.length} result{results.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
};

export default UserSearch;
