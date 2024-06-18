import {
	ActivityIndicator,
	Alert,
	Image,
	KeyboardAvoidingView,
	Pressable,
	StyleSheet,
	TouchableOpacity,
	View,
	useColorScheme,
} from "react-native";

import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	useActiveAccount,
	useConnect,
	useDisconnect,
	useActiveWallet,
	useAutoConnect,
	useWalletBalance,
	useConnectedWallets,
	useSetActiveWallet,
	ConnectButton,
	ConnectEmbed,
} from "thirdweb/react";
import {
	getUserEmail,
	inAppWallet,
	preAuthenticate,
} from "thirdweb/wallets/in-app";
import { chain, client } from "@/constants/thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { ThemedButton } from "@/components/ThemedButton";
import { useEffect, useState } from "react";
import { ThemedInput } from "@/components/ThemedInput";
import {
	InAppWalletSocialAuth,
	Wallet,
	createWallet,
	getWalletInfo,
} from "thirdweb/wallets";
import { useThemeColor } from "@/hooks/useThemeColor";

const wallets = [
	inAppWallet({
		smartAccount: {
			chain,
			sponsorGas: true,
		},
	}),
	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet"),
	createWallet("me.rainbow"),
	createWallet("com.trustwallet.app"),
	createWallet("io.zerion.wallet"),
	createWallet("xyz.argent"),
	createWallet("com.ledger"),
	createWallet("com.alphawallet"),
];
const externalWallets = wallets.slice(1);

export default function HomeScreen() {
	const theme = useColorScheme();
	return (
		<ParallaxScrollView
			headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
			headerImage={
				<Image
					source={require("@/assets/images/title.png")}
					style={styles.reactLogo}
				/>
			}
		>
			<ThemedView style={styles.titleContainer}>
				<ThemedText type="title">Connecting Wallets</ThemedText>
			</ThemedView>
			<ConnectButton
				client={client}
				theme={theme || "dark"}
				onConnect={(w) => Alert.alert("connected", w.id)}
			/>
			<ConnectEmbed
				client={client}
				theme={theme || "dark"}
				// accountAbstraction={{
				// 	chain,
				// 	sponsorGas: true,
				// }}
				onConnect={(w) => Alert.alert("connected", w.id)}
			/>
			<ConnectedSection />
		</ParallaxScrollView>
	);
}

function ConnectSection() {
	const wallet = useActiveWallet();
	const autoConnect = useAutoConnect({
		client,
		wallets,
	});
	const autoConnecting = autoConnect.isLoading;

	const c = useConnect();

	if (autoConnecting) {
		return (
			<ThemedView style={{ padding: 24 }}>
				<ActivityIndicator />
			</ThemedView>
		);
	}
	return (
		<ThemedView style={styles.stepContainer}>
			{wallet ? (
				<>
					<ConnectedSection />
				</>
			) : (
				<ThemedView style={{ gap: 16 }}>
					{/* <ThemedText type="defaultSemiBold">Connect to get started</ThemedText> */}
					<ThemedText type="defaultSemiBold">In-app wallet</ThemedText>
					<ThemedButton
						title="Custom auth"
						variant="secondary"
						onPress={async () => {
							console.log("connecting");
							await c.connect(async () => {
								const wallet = inAppWallet();
								await wallet.connect({
									client,
									strategy: "auth_endpoint",
									encryptionKey: "123",
									payload: JSON.stringify({
										foo: "bar",
									}),
								});
								return wallet;
							});
						}}
					/>
					{c.error && <ThemedText>{c.error.message}</ThemedText>}
					<ConnectInAppWallet />
					<ThemedView style={{ height: 12 }} />
					<ThemedText type="defaultSemiBold">External wallet</ThemedText>
					<ThemedView style={styles.rowContainer}>
						{externalWallets.map((w) => (
							<ConnectExternalWallet key={w.id} {...w} />
						))}
					</ThemedView>
				</ThemedView>
			)}
		</ThemedView>
	);
}

const oAuthOptions: InAppWalletSocialAuth[] = ["google", "facebook", "apple"];

function ConnectInAppWallet() {
	return (
		<>
			<ThemedView style={[styles.rowContainer]}>
				{oAuthOptions.map((auth) => (
					<ConnectWithSocial key={auth} auth={auth} />
				))}
			</ThemedView>
			<ConnectWithPhoneNumber />
		</>
	);
}

function ConnectWithSocial(props: { auth: InAppWalletSocialAuth }) {
	const bgColor = useThemeColor({}, "border");
	const { connect, isConnecting } = useConnect();
	const strategy = props.auth;
	const connectInAppWallet = async () => {
		await connect(async () => {
			const wallet = inAppWallet({
				smartAccount: {
					chain,
					sponsorGas: true,
				},
			});
			await wallet.connect({
				client,
				strategy,
				redirectUrl: "com.thirdweb.demo://",
			});
			return wallet;
		});
	};

	return (
		<ThemedView
			style={{
				flex: 1,
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				borderStyle: "solid",
				borderWidth: 1,
				borderColor: bgColor,
				borderRadius: 6,
				height: 60,
			}}
		>
			{isConnecting ? (
				<ActivityIndicator />
			) : (
				<TouchableOpacity
					key={strategy}
					onPress={connectInAppWallet}
					disabled={isConnecting}
				>
					<Image
						source={getSocialIcon(strategy)}
						style={{
							width: 38,
							height: 38,
						}}
					/>
				</TouchableOpacity>
			)}
		</ThemedView>
	);
}

function ConnectWithPhoneNumber() {
	const [screen, setScreen] = useState<"phone" | "code">("phone");
	const [sendingOtp, setSendingOtp] = useState(false);
	const [phoneNumber, setPhoneNumber] = useState("");
	const [verificationCode, setVerificationCode] = useState("");
	const { connect, isConnecting } = useConnect();

	const sendSmsCode = async () => {
		if (!phoneNumber) return;
		setSendingOtp(true);
		await preAuthenticate({
			client,
			strategy: "email",
			email: phoneNumber,
		});
		setSendingOtp(false);
		setScreen("code");
	};

	const connectInAppWallet = async () => {
		if (!verificationCode || !phoneNumber) return;
		await connect(async () => {
			const wallet = inAppWallet({
				// smartAccount: {
				// 	chain,
				// 	sponsorGas: true,
				// },
			});
			await wallet.connect({
				client,
				strategy: "email",
				email: phoneNumber,
				verificationCode,
			});
			return wallet;
		});
	};

	if (screen === "phone") {
		return (
			<ThemedInput
				placeholder="Enter phone number"
				onChangeText={setPhoneNumber}
				value={phoneNumber}
				keyboardType="phone-pad"
				onSubmit={sendSmsCode}
				isSubmitting={sendingOtp}
			/>
		);
	}

	return (
		<>
			<ThemedInput
				placeholder="Enter verification code"
				onChangeText={setVerificationCode}
				value={verificationCode}
				keyboardType="numeric"
				onSubmit={connectInAppWallet}
				isSubmitting={isConnecting}
			/>
		</>
	);
}

function ConnectExternalWallet(wallet: Wallet) {
	const { connect, isConnecting, error } = useConnect();
	const [walletName, setWalletName] = useState<string | null>(null);
	const [walletImage, setWalletImage] = useState<string | null>(null);

	useEffect(() => {
		const fetchWalletName = async () => {
			const [name, image] = await Promise.all([
				getWalletInfo(wallet.id).then((info) => info.name),
				getWalletInfo(wallet.id, true),
			]);
			setWalletName(name);
			setWalletImage(image);
		};
		fetchWalletName();
	}, [wallet]);

	const connectExternalWallet = async () => {
		await connect(async () => {
			await wallet.connect({
				client,
			});
			return wallet;
		});
	};

	return (
		walletImage &&
		walletName && (
			<ThemedView
				style={{
					flexDirection: "column",
					alignItems: "center",
				}}
			>
				{isConnecting && !error ? (
					<ActivityIndicator style={{ width: 60, height: 60 }} />
				) : (
					<>
						<Pressable onPress={connectExternalWallet} disabled={isConnecting}>
							<Image
								source={{ uri: walletImage ?? "" }}
								style={{ width: 60, height: 60, borderRadius: 6 }}
							/>
						</Pressable>
						<ThemedText style={{ fontSize: 11 }} type="defaultSemiBold">
							{walletName.split(" ")[0]}
						</ThemedText>
					</>
				)}
			</ThemedView>
		)
	);
}

function ConnectedSection() {
	const { disconnect } = useDisconnect();
	const account = useActiveAccount();
	const activeWallet = useActiveWallet();
	const setActive = useSetActiveWallet();
	const connectedWallets = useConnectedWallets();
	const balanceQuery = useWalletBalance({
		address: account?.address,
		chain: activeWallet?.getChain(),
		client,
	});
	const [email, setEmail] = useState("");
	useEffect(() => {
		const fetchEmail = async () => {
			if (activeWallet?.id === "inApp") {
				try {
					const email = await getUserEmail({
						client,
					});
					if (email) {
						setEmail(email);
					}
				} catch (e) {
					// no email
				}
			} else {
				setEmail("");
			}
		};
		fetchEmail();
	}, [account]);

	const switchWallet = async () => {
		const activeIndex = connectedWallets.findIndex(
			(w) => w.id === activeWallet?.id,
		);
		const nextWallet =
			connectedWallets[(activeIndex + 1) % connectedWallets.length];
		if (nextWallet) {
			await setActive(nextWallet);
		}
	};

	return (
		<>
			{account ? (
				<>
					<ThemedText>Connected Wallets: </ThemedText>
					<ThemedView style={{ gap: 2 }}>
						{connectedWallets.map((w, i) => (
							<ThemedText key={w.id + i} type="defaultSemiBold">
								- {w.id} {w.id === activeWallet?.id ? "✅" : ""}
							</ThemedText>
						))}
					</ThemedView>
					<ThemedView style={{ height: 12 }} />
					{email && activeWallet?.id === "inApp" && (
						<ThemedText>
							Email: <ThemedText type="defaultSemiBold">{email}</ThemedText>
						</ThemedText>
					)}
					<ThemedText>
						Address:{" "}
						<ThemedText type="defaultSemiBold">
							{shortenAddress(account.address)}
						</ThemedText>
					</ThemedText>
					<ThemedText>
						Chain:{" "}
						<ThemedText type="defaultSemiBold">
							{activeWallet?.getChain()?.name || "Unknown"}
						</ThemedText>
					</ThemedText>
					<ThemedText>
						Balance:{" "}
						{balanceQuery.data && (
							<ThemedText type="defaultSemiBold">
								{`${balanceQuery.data?.displayValue.slice(0, 8)} ${
									balanceQuery.data?.symbol
								}`}
							</ThemedText>
						)}
					</ThemedText>
					<ThemedView style={{ height: 12 }} />
					{connectedWallets.length > 1 && (
						<ThemedButton
							variant="secondary"
							title="Switch Wallet"
							onPress={switchWallet}
						/>
					)}
					<ThemedButton
						title="Sign message"
						variant="secondary"
						onPress={async () => {
							if (account) {
								account.signMessage({ message: "hello world" });
							}
						}}
					/>
					<ThemedButton
						title="Disconnect"
						variant="secondary"
						onPress={async () => {
							if (activeWallet) {
								disconnect(activeWallet);
							}
						}}
					/>
					<ThemedView style={{ height: 12 }} />
					<ThemedText type="defaultSemiBold">Connect another wallet</ThemedText>
					<ThemedView style={styles.rowContainer}>
						{externalWallets
							.filter(
								(w) => !connectedWallets.map((cw) => cw.id).includes(w.id),
							)
							.map((w, i) => (
								<ConnectExternalWallet key={w.id + i} {...w} />
							))}
					</ThemedView>
				</>
			) : (
				null
			)}
		</>
	);
}

const styles = StyleSheet.create({
	titleContainer: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	stepContainer: {
		gap: 8,
		marginBottom: 8,
	},
	reactLogo: {
		height: "100%",
		width: "100%",
		bottom: 0,
		left: 0,
		position: "absolute",
	},
	rowContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 24,
		justifyContent: "space-evenly",
	},
});

function getSocialIcon(strategy: string) {
	switch (strategy) {
		case "google":
			return require("@/assets/images/google.png");
		case "facebook":
			return require("@/assets/images/facebook.png");
		case "apple":
			return require("@/assets/images/apple.png");
	}
}
