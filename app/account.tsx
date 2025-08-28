import { useAuth } from "@/context/authContext";
import { router } from "expo-router";
import { View } from "react-native";
import { Button } from "react-native-paper";


export default function userAccountScreen(){
    const  {signOut} = useAuth()
    return(
        <View style={{flex: 1, gap:10,  justifyContent: "center", alignItems: "center" }}>
        <Button  mode="contained" icon={'logout'} onPress={signOut}>
            signOut
        </Button>

        <Button  mode="contained" icon={'logout'} onPress={()=>router.replace('/login')}>
            login
        </Button>
        </View>
    )
}