import { supabase } from '../../../../lib/supabaseClient';
import NavBar from './NavBar'

export default async function Navigation(){
    const {data: profiles, error } = await supabase.from('profiles').select('*')

    if (error){
        throw new Error(error.message);
    }

    return(
        <NavBar profiles={profiles} />
    );
}
