import { useAuth } from "@/context/authContext";
import { router } from "expo-router";
import { View } from "react-native";
import { Button, Text, } from "react-native-paper";


export default function userAccountScreen(){
    const  {signOut} = useAuth()
    return(
        <View style={{flex: 1, gap:10,  justifyContent: "center", alignItems: "center" }}>
        <Button  mode="contained" icon={'logout'} onPress={signOut}>
            <Text> Sign Out</Text>
        </Button>

        <Button  mode="contained" icon={'logout'} onPress={()=>router.replace('/login')}>
             <Text> login</Text>
        </Button>
        </View>
    )
}