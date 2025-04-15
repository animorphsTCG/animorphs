
export const extractVideoId = (url: string): string => {
  if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
    return url; // Assume it's already a video ID
  }
  
  // Handle youtube.com URL format
  if (url.includes('youtube.com/watch?v=')) {
    const params = new URLSearchParams(url.split('?')[1]);
    return params.get('v') || '';
  }
  
  // Handle youtu.be URL format
  if (url.includes('youtu.be/')) {
    return url.split('youtu.be/')[1].split('?')[0];
  }
  
  return '';
};

export const buildYouTubeUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};
