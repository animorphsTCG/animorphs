
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/modules/auth';
import { eosVoice, VoiceRoomState, VoiceSettings, defaultVoiceSettings } from '@/lib/eos/eosVoice';

export const useEOSVoice = (roomName: string) => {
  const { user, token } = useAuth();
  const [voiceState, setVoiceState] = useState<VoiceRoomState>({
    roomName,
    participants: [],
    isJoined: false,
    isConnecting: false,
    error: null
  });
  const [settings, setSettings] = useState<VoiceSettings>(defaultVoiceSettings);
  
  // Load saved settings
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('eos_voice_settings');
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          setSettings({
            ...defaultVoiceSettings,
            ...parsed
          });
        } catch (error) {
          console.error("Failed to parse voice settings:", error);
        }
      }
    };
    
    loadSettings();
  }, []);
  
  // Save settings when changed
  useEffect(() => {
    localStorage.setItem('eos_voice_settings', JSON.stringify(settings));
  }, [settings]);
  
  // Initialize voice system
  useEffect(() => {
    const initVoice = async () => {
      await eosVoice.initializeVoice();
    };
    
    initVoice();
  }, []);
  
  // Join the voice room
  const joinRoom = useCallback(async () => {
    if (!user?.id || !token?.access_token || voiceState.isJoined || voiceState.isConnecting) {
      return false;
    }
    
    try {
      setVoiceState(prev => ({
        ...prev,
        isConnecting: true,
        error: null
      }));
      
      const success = await eosVoice.joinVoiceRoom(token.access_token, user.id, roomName);
      
      if (success) {
        setVoiceState(prev => ({
          ...prev,
          isJoined: true,
          isConnecting: false,
          participants: [
            // This would normally come from the EOS API
            // Mock data for now
            {
              userId: user.id,
              displayName: user.displayName || "You",
              isSpeaking: false,
              isMuted: false,
              volume: 1.0
            }
          ]
        }));
        return true;
      } else {
        setVoiceState(prev => ({
          ...prev,
          isConnecting: false,
          error: "Failed to join voice room"
        }));
        return false;
      }
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        isConnecting: false,
        error: error.message || "Unknown error joining voice room"
      }));
      return false;
    }
  }, [user, token, roomName, voiceState.isJoined, voiceState.isConnecting]);
  
  // Leave the voice room
  const leaveRoom = useCallback(async () => {
    if (!token?.access_token || !voiceState.isJoined) {
      return false;
    }
    
    try {
      const success = await eosVoice.leaveVoiceRoom(token.access_token, roomName);
      
      if (success) {
        setVoiceState(prev => ({
          ...prev,
          isJoined: false,
          participants: []
        }));
        return true;
      } else {
        setVoiceState(prev => ({
          ...prev,
          error: "Failed to leave voice room"
        }));
        return false;
      }
    } catch (error) {
      setVoiceState(prev => ({
        ...prev,
        error: error.message || "Unknown error leaving voice room"
      }));
      return false;
    }
  }, [token, roomName, voiceState.isJoined]);
  
  // Automatically join the voice room if settings.autoJoinVoice is true
  useEffect(() => {
    if (user && settings.autoJoinVoice && !voiceState.isJoined && !voiceState.isConnecting) {
      joinRoom();
    }
    
    // Cleanup when component unmounts
    return () => {
      if (voiceState.isJoined) {
        leaveRoom();
      }
    };
  }, [user, settings.autoJoinVoice, voiceState.isJoined, voiceState.isConnecting, joinRoom, leaveRoom]);
  
  // Toggle mute state
  const toggleMute = useCallback(async () => {
    if (!voiceState.isJoined) return;
    
    try {
      // Get current user from participants
      const currentUser = voiceState.participants.find(p => p.userId === user?.id);
      if (!currentUser) return;
      
      const newMuteState = !currentUser.isMuted;
      const success = await eosVoice.setMuted(newMuteState);
      
      if (success) {
        setVoiceState(prev => ({
          ...prev,
          participants: prev.participants.map(p => 
            p.userId === user?.id ? { ...p, isMuted: newMuteState } : p
          )
        }));
      }
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  }, [user, voiceState.isJoined, voiceState.participants]);
  
  // Update voice settings
  const updateSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Apply relevant settings immediately
    if (newSettings.inputDevice !== undefined) {
      eosVoice.setInputDevice(newSettings.inputDevice);
    }
    
    if (newSettings.outputDevice !== undefined) {
      eosVoice.setOutputDevice(newSettings.outputDevice);
    }
  }, []);
  
  return {
    voiceState,
    settings,
    joinRoom,
    leaveRoom,
    toggleMute,
    updateSettings
  };
};

export default useEOSVoice;
