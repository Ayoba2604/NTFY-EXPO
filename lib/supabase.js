import 'react-native-url-polyfill/auto'; // necessário para o supabase-js funcionar no React Native
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Cliente único do Supabase, reaproveitado em todo o app
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
