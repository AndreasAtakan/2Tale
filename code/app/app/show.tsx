import { useState, useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import * as FileSystem from 'expo-file-system';
//import * as MediaLibrary from 'expo-media-library';
import { Audio /*Video as RNVideo, AVPlaybackStatus*/ } from 'expo-av';
import {
	Text,
	Button,
	Spinner,
	Image
} from "tamagui";
import {
	Play,
	Pause,
	ArrowLeft
} from "@tamagui/lucide-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
//import { FFmpegKit, FFmpegKitConfig, ReturnCode } from "ffmpeg-kit-react-native";

import Replicate from "replicate";
import { Configuration as GptConfig, OpenAIApi } from "openai";

import { MainStack } from "../components/MainStack";
import { orange } from "../utils/colors";
import { shuffle } from "../utils/helpers";
import { terms } from "../utils/constants";

const replicate = new Replicate({
	auth: '[api-key]'
});

const gptConfig = new GptConfig({
	organization: '[org]',
	apiKey: '[api-key]',
});
const openai = new OpenAIApi(gptConfig);

const googleCloudKey = "[api-key]";

const styles = StyleSheet.create({
	video: {
		alignSelf: 'center',
		width: 320,
		height: 200
	}
});

export default function Show() {
	const router = useRouter();

	const { height, width } = useWindowDimensions();

	//const VIDEO_REF = useRef<RNVideo>(null);

	const [error, setError] = useState<string>("");
	const [loading, setLoading] = useState<boolean>(true);
	const [loadingText, setLoadingText] = useState<string>("");
	//const [video, setVideo] = useState<string>("");
	//const [playback, setPlayback] = useState<AVPlaybackStatus | null>(null);
	const [image, setImage] = useState<string>("");
	const [audio, setAudio] = useState<any>();
	const [playback, setPlayback] = useState<boolean>(true);

	const toggleAudio = async () => {
		if(!audio) { return; }

		try {
			if(playback) { await audio.pauseAsync(); }
			else { await audio.playAsync(); }
			setPlayback(!playback);
		}
		catch(e) { console.error(e); }
	};

	useEffect(() => {
		const load = async () => {
			try {
				//await FFmpegKitConfig.init();
				await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
				if(audio) { audio.unloadAsync(); }

				const val = await AsyncStorage.getItem("imgs");
				if(!val) { return; }

				const s = await AsyncStorage.getItem("settings");
				let settings = JSON.parse(s || "{}");
				settings = { type: "funny", level: 15, ...settings };

				let message = `Write me a ${settings.type} story based on the following:`,
					imgs = JSON.parse(val);

				setLoadingText(`Processing ${imgs.length > 1 ? "images" : "image"}...`);

				for(let img of imgs) {
					let base64 = await FileSystem.readAsStringAsync(img, { encoding: 'base64' });
					let caption = await replicate.run(
						"salesforce/blip:2e1dddc8621f72155f24cf2e0adbde548458d3cab9f00c0139eea840d0ac4746",
						//"pharmapsychotic/clip-interrogator:a4a8bafd6089e1716b06057c42b19378250d008b80fe87caa5cd36d40c1eda90",
						{
							input: {
								task: 'image_captioning',
								image: `data:image/png;base64,${base64}`
							}
						}
					);
					message += `\n${ caption.replace("Caption: ", "") }.`;
				}
				let t = shuffle([ ...terms ]), level = Math.round( settings.level / 100 * 30 );
				for(let i = 0; i < level; i++) { message += `\n${t.pop()}.`; }
				console.log(message);

				setLoadingText(`Creating ${settings.type} story...`);

				const gpt = await openai.createChatCompletion({
					model: "gpt-3.5-turbo",
					messages: [
						{ role: "user", content: message }
					]
				});
				const aiStory = gpt.data.choices[0].message.content;
				console.log(aiStory);

				setLoadingText("Narrating...");

				let voice: any, pitch = 1;
				switch(settings.type) {
					case "funny": voice = { name: 'en-US-Standard-I', ssmlGender: 'MALE' }; break;
					case "happy": voice = { name: 'en-US-Standard-H', ssmlGender: 'FEMALE' }; break;
					case "scary": voice = { name: 'en-US-Standard-J', ssmlGender: 'MALE' }; pitch = -8; break;
					case "sad": voice = { name: 'en-US-Standard-C', ssmlGender: 'FEMALE' }; pitch = -1; break;
					default: voice = { name: 'en-US-Standard-I', ssmlGender: 'MALE' }; break;
				}
				let res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleCloudKey}`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json; charset=utf-8'
					},
					body: JSON.stringify({
						input: { text: aiStory },
						voice: { languageCode: 'en-US', ...voice },
						audioConfig: { audioEncoding: 'MP3', pitch } // LINEAR16
					})
				});
				const text2speech = await res.json();

				let audioUri = FileSystem.documentDirectory + "out.mp3";
				await FileSystem.writeAsStringAsync(audioUri, text2speech.audioContent, {
					encoding: FileSystem.EncodingType.Base64
				});

				/*setLoadingText("Creating video...");

				let videoUri = FileSystem.documentDirectory + "out.mp4";
				const ffmpegSession = await FFmpegKit.execute(
					`-loop 1 -i ${imgs[0]} -i "data:audio/wav;base64,${text2speech.audioContent}" -c:a aac -ab 112k -c:v libx264 -shortest -strict -2 ${videoUri}`
				);
				let resCode = await ffmpegSession.getReturnCode();
				if(!ReturnCode.isSuccess(resCode)) {
					throw new Error("FFmpegKit failed");
				}*/

				const { sound } = await Audio.Sound.createAsync(
					{ uri: audioUri },
					{ isLooping: true, shouldPlay: true }
				);

				setLoadingText("Done!");
				//setVideo(videoUri);
				setAudio(sound); setImage(imgs[0]);
				setLoading(false);
				console.log("Done");
			}
			catch(e) {
				console.error(e);
				setError(`Error: ${e}`);
				setLoading(false);
			}
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
					<>
						<Spinner
							size="large"
							color={orange[400]}
						/>
						<Text
							color="white"
							marginTop={50}
						>
							{loadingText}
						</Text>
					</>
				)
				:
				audio && image && (
					<>
						<Image
							source={{
								uri: image,
								width,
								height
							}}
						/>
						<Button
							themeInverse={true}
							chromeless={true}
							color="#e6e6e6"
							width={45}
							height={45}
							position="absolute"
							top={20}
							left={20}
							zIndex={2}
							icon={<ArrowLeft size={24} strokeWidth={3} />}
							onPress={() => router.back()}
						/>
						<Button
							themeInverse={true}
							//chromeless={true}
							//color="#e6e6e6"
							width={45}
							height={45}
							position="absolute"
							bottom={20}
							right={20}
							zIndex={2}
							icon={
								playback ?
									<Pause size={24} strokeWidth={3} />
									:
									<Play size={24} strokeWidth={3} />
							}
							onPress={toggleAudio}
						/>
					</>
				)
				||
				error && (
					<Text color="white">{error}</Text>
				)
			}
		</MainStack>
	);
}
