import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sqjzunerpujqidvgepiw.supabase.co";

const supabaseKey =
  "sb_publishable_ZA0bijERguleRZhE4XqxCQ_rTAIOkWJ";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);