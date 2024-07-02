import { Image, StyleSheet, View, useColorScheme } from "react-native";

import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
	useActiveAccount,
	useConnect,
	useDisconnect,
	useActiveWallet,
	ConnectButton,
	ConnectEmbed,
} from "thirdweb/react";
import { getUserEmail, inAppWallet } from "thirdweb/wallets/in-app";
import { chain, client } from "@/constants/thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { ThemedButton } from "@/components/ThemedButton";
import { useEffect, useState } from "react";
import { createWallet } from "thirdweb/wallets";
import { ethereum } from "thirdweb/chains";

const wallets = [
	createWallet("io.metamask"),
	createWallet("com.coinbase.wallet"),
	createWallet("me.rainbow"),
	createWallet("com.trustwallet.app"),
	createWallet("io.zerion.wallet"),
];

export default function HomeScreen() {
	const account = useActiveAccount();
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
			<View>
				<ThemedText type="subtitle">{`<ConnectButton />`}</ThemedText>
				<ThemedText type="subtext">
					Configurable button + modal, handles both connection and connected
					state. Example below has Smart Accounts enabled.
				</ThemedText>
			</View>
			<ConnectButton
				client={client}
				theme={theme || "dark"}
				accountAbstraction={{
					chain,
					sponsorGas: true,
				}}
			/>
			<View style={{ height: 16 }} />
			<View>
				<ThemedText type="subtitle">{`<ConnectEmbed />`}</ThemedText>
				<ThemedText type="subtext">
					Embeddable connection component in any screen. Example below is
					configured with a specific list of EOAs.
				</ThemedText>
			</View>
			<ConnectEmbed
				client={client}
				theme={theme || "dark"}
				chain={ethereum}
				wallets={wallets}
			/>
			{account && (
				<ThemedText type="subtext">
					ConnectEmbed does not render when connected, use the `onConnect` prop
					to navigate to a new screen instead.
				</ThemedText>
			)}
			<View style={{ height: 16 }} />
			<View>
				<ThemedText type="subtitle">{`Custom UI`}</ThemedText>
				<ThemedText type="subtext">
					Easy to use the hooks to build your own UI. Example below connects to
					a smart Google account or metamask EOA.
				</ThemedText>
			</View>
			<CustomConnectUI />
		</ParallaxScrollView>
	);
}

const CustomConnectUI = () => {
	const wallet = useActiveWallet();
	const account = useActiveAccount();
	const [email, setEmail] = useState<string | undefined>();
	const { disconnect } = useDisconnect();
	useEffect(() => {
		if (wallet && wallet.id === "inApp") {
			getUserEmail({ client }).then(setEmail);
		}
	}, [wallet]);

	return wallet && account ? (
		<View>
			<ThemedText>Connected as {shortenAddress(account.address)}</ThemedText>
			{email && <ThemedText type="subtext">{email}</ThemedText>}
			<View style={{ height: 16 }} />
			<ThemedButton onPress={() => disconnect(wallet)} title="Disconnect" />
		</View>
	) : (
		<>
			<ConnectWithGoogle />
			<ConnectWithMetaMask />
		</>
	);
};

const ConnectWithGoogle = () => {
	const { connect, isConnecting } = useConnect();
	return (
		<ThemedButton
			title="Connect with Google"
			loading={isConnecting}
			loadingTitle="Connecting..."
			onPress={() => {
				connect(async () => {
					const w = inAppWallet({
						smartAccount: {
							chain,
							sponsorGas: true,
						},
					});
					await w.connect({
						client,
						strategy: "google",
					});
					return w;
				});
			}}
		/>
	);
};

const ConnectWithMetaMask = () => {
	const { connect, isConnecting } = useConnect();
	return (
		<ThemedButton
			title="Connect with MetaMask"
			variant="secondary"
			loading={isConnecting}
			loadingTitle="Connecting..."
			onPress={() => {
				connect(async () => {
					const w = createWallet("io.metamask");
					await w.connect({
						client,
					});
					return w;
				});
			}}
		/>
	);
};

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
