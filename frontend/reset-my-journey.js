Write(reset-my-journey.js)
  ⎿  Wrote 1 lines to reset-my-journey.js
     require('dotenv').config();
     const { createClient } = require('@supabase/supabase-js');
     const supabase = createClient(
       process.env.SUPABASE_URL,
       process.env.SUPABASE_SERVICE_ROLE_KEY
     );
     const USER_ID = 8;