import { useState, useEffect, useRef } from "react";
import { StyleSheet } from "react-native";
import { PinchGestureHandler } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import { Camera as RNCamera, CameraType, FlashMode } from "expo-camera";
import {
	H4,
	Text,
	Button,
	Spinner,
	XStack,
	ZStack,
	Image,
	Sheet,
	Adapt,
	Select,
	Slider
} from "tamagui";
import {
	X,
	Check,
	Settings,
	ChevronDown,
	Camera as CameraIcon,
	SwitchCamera,
	Zap as FlashOn,
	ZapOff as FlashOff
} from "@tamagui/lucide-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";

//import mobileAds, { BannerAd, TestIds } from "react-native-google-mobile-ads";

import { MainStack } from "../components/MainStack";
import { orange, green } from "../utils/colors";

const styles = StyleSheet.create({
	camera: {
		flex: 1,
		flexDirection: 'column',
		alignItems: 'center',
		alignContent: 'space-between',
		justifyContent: 'space-between'
	},
	adBanner: {
		position: 'absolute',
		top: 0,
		left: 0,
		width: '200px'
	}
});

const _MAX_IMGS = 3;
let timeout: any;

export default function Camera() {
	const router = useRouter();

	const CAMERA_REF = useRef<RNCamera>(null);

	const [camera, setCamera] = useState<CameraType>(CameraType.back);
	const [flash, setFlash] = useState<FlashMode>(FlashMode.off);
	const [zoom, setZoom] = useState<number>(0);
	const [imgs, setImgs] = useState<string[]>([]);
	const [granted, setGranted] = useState<boolean>(false);
	const [permission, requestPermission] = RNCamera.useCameraPermissions();
	const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
	const [storyType, setStoryType] = useState<string>("funny");
	const [storyLevel, setStoryLevel] = useState<number>(15);

	const takePicture = async () => {
		if(!CAMERA_REF.current) { return; }
		let img = await CAMERA_REF.current.takePictureAsync({
			//exif: true,
			//additionalExif: {}
		});
		setImgs([ ...imgs, img.uri ]);
	};

	const switchCamera = async () => {
		if(camera == CameraType.back) {
			setCamera(CameraType.front);
		}
		else
		if(camera == CameraType.front) {
			setCamera(CameraType.back);
		}
	};

	const changeFlash = async () => {
		if(flash == FlashMode.on) { setFlash(FlashMode.off); }
		else
		if(flash == FlashMode.off) { setFlash(FlashMode.on); }
	};

	const changeZoom = async (ev: any) => {
		let z = 0;
		if(ev.nativeEvent.scale > 1 && zoom < 1) { z = zoom + 0.005; }
		if(ev.nativeEvent.scale < 1 && zoom > 0) { z = zoom - 0.005; }
		setZoom(Math.max( 0, Math.min( 1, z ) ));
	};

	const removeImg = async () => { setImgs( imgs.slice(0, -1) ); };

	const saveStoryType = async (type: string) => {
		setStoryType(type);
		try { await AsyncStorage.mergeItem("settings", JSON.stringify({ type })); }
		catch(e) { console.error(e); }
	};
	const saveStoryLevel = async (level: number) => {
		if(timeout) { clearTimeout(timeout); }
		timeout = setTimeout(async () => {
			setStoryLevel(level);
			try { await AsyncStorage.mergeItem("settings", JSON.stringify({ level })); }
			catch(e) { console.error(e); }
		}, 500);
	};

	const create = async () => {
		try { await AsyncStorage.setItem("imgs", JSON.stringify(imgs)); }
		catch(e) { console.error(e); }

		router.push("/show");
	};

	useEffect(() => {
		const load = async () => {
			try {
				const val = await AsyncStorage.getItem("settings");
				let settings = JSON.parse(val || "null");
				if(settings) {
					if(settings.type) { setStoryType(settings.type); }
					if(settings.level) { setStoryLevel(settings.level); }
				}

				//const adInit = await mobileAds().initialize();

				if(!permission || !permission.granted) {
					if(!requestPermission) { return; }
					let res = await requestPermission();
					setGranted(res.granted);
				}
				else { setGranted(true); }
			}
			catch(e) { console.error(e); }
		};
		load();
	}, []);

	/*
	<BannerAd
		unitId={TestIds.BANNER}
		style={styles.adBanner}
	/>
	*/
	return (
		<MainStack>
			{
				!granted ?
				(
					<Spinner
						size="large"
						color={orange[400]}
						marginTop={100}
					/>
				)
				:
				(
					<>
						<Sheet
							forceRemoveScrollEnabled={settingsOpen}
							modal
							open={settingsOpen}
							onOpenChange={setSettingsOpen}
							snapPoints={[45]}
							dismissOnSnapToBottom
							//native
						>
							<Sheet.Overlay />
							<Sheet.Frame
								flex={1}
								padding="$4"
								//justifyContent="center"
								alignItems="center"
								space="$5"
							>
								<H4 color="white">Settings</H4>

								<XStack ai="center" marginVertical={20} space>
									<Text color="white">Story type</Text>
									<Select
										id="storyType"
										value={storyType}
										onValueChange={saveStoryType}
									>
										<Select.Trigger size="$3" width="auto" iconAfter={ChevronDown}>
											<Select.Value placeholder="Story type" />
										</Select.Trigger>

										<Adapt when="sm" platform="touch">
											<Sheet native modal snapPoints={[40]} dismissOnSnapToBottom>
												<Sheet.Overlay />
												<Sheet.Frame>
													<Sheet.ScrollView>
														<Adapt.Contents />
													</Sheet.ScrollView>
												</Sheet.Frame>
											</Sheet>
										</Adapt>

										<Select.Content>
											<Select.Viewport minWidth={200}>
												<Select.Group space="$0">
													<Select.Label>Story type</Select.Label>
													{["funny", "happy", "scary", "sad"].map((item, idx) => (
														<Select.Item index={idx} key={item} value={item}>
															<Select.ItemText color="white">{item}</Select.ItemText>
															<Select.ItemIndicator marginLeft="auto">
																<Check size={16} />
															</Select.ItemIndicator>
														</Select.Item>
													))}
												</Select.Group>
											</Select.Viewport>
										</Select.Content>
									</Select>
								</XStack>

								<XStack ai="center" space>
									<Text color="white">Absurdity level</Text>
									<Slider
										defaultValue={[storyLevel]}
										onValueChange={v => saveStoryLevel(v[0])}
										max={100}
										step={1}
										width={150}
										size="$2"
									>
										<Slider.Track themeInverse>
											<Slider.TrackActive />
										</Slider.Track>
										<Slider.Thumb index={0} circular elevate />
									</Slider>
								</XStack>
							</Sheet.Frame>
						</Sheet>

						<PinchGestureHandler onGestureEvent={ev => changeZoom(ev)}>
							<RNCamera
								ref={CAMERA_REF}
								style={styles.camera}
								type={camera}
								flashMode={flash}
								zoom={zoom}
							>
								<Button
									//chromeless={true}
									disabled={imgs.length >= _MAX_IMGS}
									color={imgs.length >= _MAX_IMGS ? "grey" : "white"}
									borderBottomLeftRadius={0}
									width={65}
									height={65}
									position="absolute"
									bottom={20}
									right={20}
									icon={<CameraIcon size={32} strokeWidth={3} />}
									onPress={takePicture}
								/>
								<Button
									//chromeless={true}
									disabled={imgs.length <= 0}
									color={imgs.length <= 0 ? "grey" : "white"}
									borderTopRightRadius={0}
									borderBottomRightRadius={0}
									backgroundColor={green[900]}
									width={45}
									height={45}
									position="absolute"
									bottom={20}
									right={85}
									icon={<Check size={24} strokeWidth={3} />}
									onPress={create}
								/>

								<Button
									themeInverse={true}
									chromeless={true}
									color="#e6e6e6"
									width={45}
									height={45}
									position="absolute"
									top={20}
									right={20}
									icon={<SwitchCamera size={24} strokeWidth={3} />}
									onPress={switchCamera}
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
									icon={<Settings size={24} strokeWidth={3} />}
									onPress={() => setSettingsOpen(true)}
								/>

								<Button
									themeInverse={true}
									chromeless={true}
									color="#e6e6e6"
									width={45}
									height={45}
									position="absolute"
									top={20}
									left={75}
									icon={
										flash == FlashMode.on ?
										( <FlashOn size={24} strokeWidth={3} /> )
										:
										( <FlashOff size={24} strokeWidth={3} /> )
									}
									onPress={changeFlash}
								/>

								{
									zoom > 0 && zoom < 1 &&
									(
										<Text
											color="white"
											position="absolute"
											top={32}
											left="50%"
										>
											<X size={15} /> {Math.round((1 - zoom) * 100) / 100}
										</Text>
									)
								}

								{
									imgs.length > 0 &&
									(
										<ZStack
											flex={1}
											width="auto"
											height="auto"
											position="absolute"
											left={20}
											bottom={20 + 150}
										>
											{
												imgs.map((img, idx) =>
													<Image
														key={idx}
														br={10}
														x={10 * idx}
														y={-5 * idx}
														source={{
															uri: img,
															width: 150,
															height: 150
														}}
														//borderColor="#fefefe" // NOTE: causes a UI-warning
														//borderWidth={1}
														onPress={() => removeImg()}
													/>
												)
											}
										</ZStack>
									)
								}
							</RNCamera>
						</PinchGestureHandler>
					</>
				)
			}
		</MainStack>
	);
}
