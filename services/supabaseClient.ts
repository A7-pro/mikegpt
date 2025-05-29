import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// User related functions
export const createUser = async (email: string, username: string, profile?: any) => {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, username, profile }])
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUser = async (email: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();
  
  if (error) throw error;
  return data;
};

// Chat messages related functions
export const saveMessage = async (userId: string, message: any) => {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      user_id: userId,
      sender: message.sender,
      content: message.text,
      type: message.type,
      timestamp: message.timestamp
    }])
    .select();
  
  if (error) throw error;
  return data;
};

export const getUserMessages = async (userId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: true });
  
  if (error) throw error;
  return data;
};

// Conversations related functions
export const saveConversation = async (userId: string, name: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .insert([{
      user_id: userId,
      name,
      created_at: new Date().toISOString()
    }])
    .select();
  
  if (error) throw error;
  return data;
};

export const getUserConversations = async (userId: string) => {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
};