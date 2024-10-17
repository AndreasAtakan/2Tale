import { useState, useEffect } from "react";
import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { A } from '@expo/html-elements';
import {
	Text,
	Input,
	Button,
	Spinner
} from "tamagui";
import {
	LogIn
} from "@tamagui/lucide-icons";

import AsyncStorage from '@react-native-async-storage/async-storage';

import { MainStack } from "../components/MainStack";
import { orange, slate } from "../utils/colors";

const styles = StyleSheet.create({
	link: { color: 'lightblue' }
});

export default function Main() {
	const router = useRouter();

	const [loading, setLoading] = useState<boolean>(true);
	const [email, setEmail] = useState<string>("");

	const register = async () => {
		try {
			if(!email) { return; }

			// TODO: register email at API
			console.log(email);

			await AsyncStorage.setItem("registered", "true");
		}
		catch(e) { console.error(e); }

		router.push("/camera");
	};

	useEffect(() => {
		const load = async () => {
			const val = await AsyncStorage.getItem("registered");

			let registered = JSON.parse(val || "null");
			if(!registered) { setLoading(false); return; }

			router.replace("/camera");
		};
		load();
	}, []);

	return (
		<MainStack
			ai="center"
			jc="center"
		>
			{
				loading ?
				(
					<Spinner
						size="large"
						color={orange[400]}
					/>
				)
				:
				(
					<>
						<Input
							themeInverse={true}
							size="$4"
							width="70%"
							placeholder="Enter e-mail address"
							onChangeText={v => setEmail(v)}
						/>
						<Text
							color="grey"
							fontSize={10}
							marginTop={10}
						>
							By registering you agree to our <A style={styles.link} href="https://2tale.no/tos.html">Terms and Conditions</A>
						</Text>
						<Button
							//chromeless={true}
							themeInverse={true}
							backgroundColor={slate[300]}
							size="$4"
							marginTop={20}
							icon={<LogIn size={24} strokeWidth={3} />}
							onPress={register}
						/>
					</>
				)
			}
		</MainStack>
	);
}
