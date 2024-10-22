import { Image, StyleSheet, View } from "react-native";
import { ParallaxScrollView } from "@/components/ParallaxScrollView";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  useActiveAccount,
  useConnect,
  useDisconnect,
  useActiveWallet,
  useSwitchActiveWalletChain,
  useWalletInfo,
  TransactionButton,
  useActiveWalletChain,
  useAutoConnect,
} from "thirdweb/react";
import {
  getUserEmail,
  inAppWallet,
} from "thirdweb/wallets/in-app";
import { chain, client } from "@/constants/thirdweb";
import { shortenAddress } from "thirdweb/utils";
import { ThemedButton } from "@/components/ThemedButton";
import { useEffect, useState } from "react";
import { createWallet, WalletId } from "thirdweb/wallets";
import {
  arbitrum,
  base,
  ethereum,
  polygon,
} from "thirdweb/chains";
import { prepareTransaction } from "thirdweb";


export default function HomeScreen() {
  const account = useActiveAccount();
  const switchChain = useSwitchActiveWalletChain();
  const activeChain = useActiveWalletChain();
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
      <CustomConnectUI />
      <View style={{ height: 16 }} />
      {account && activeChain && (
        <>
          <ThemedButton
            onPress={() => switchChain(base)}
            title="Switch to Base"
          />
          <ThemedButton
            onPress={() => switchChain(arbitrum)}
            title="Switch to Arbitrum"
          />
          <ThemedButton
            onPress={() => switchChain(polygon)}
            title="Switch to Polygon"
          />
          <ThemedButton
            onPress={() => switchChain(ethereum)}
            title="Switch to Ethereum"
          />
          <TransactionButton 
            
          transaction={() => {
            return prepareTransaction({
              to: account.address,
              value: 0n,
              chain: activeChain,
              client,
            })
          }} >
            <ThemedText type="default" darkColor="#000" lightColor="#000">Dummy Tx</ThemedText>
          </TransactionButton>
        </>
      )}
    </ParallaxScrollView>
  );
}

const CustomConnectUI = () => {
  const wallet = useActiveWallet();
  const account = useActiveAccount();
  const chain = useActiveWalletChain();
  const [email, setEmail] = useState<string | undefined>();
  const { disconnect } = useDisconnect();
  const { isLoading: isAutoConnecting } = useAutoConnect({
    client,
    wallets: [inAppWallet(), createWallet("me.rainbow"), createWallet("io.metamask")]
  });
  useEffect(() => {
    if (wallet && wallet.id === "inApp") {
      getUserEmail({ client }).then(setEmail);
    }
  }, [wallet]);

  return wallet && account ? (
    <View>
      <ThemedText>Connected as {shortenAddress(account.address)}</ThemedText>
      <ThemedText type="subtext">Chain: {chain?.id}</ThemedText>
      {email && <ThemedText type="subtext">{email}</ThemedText>}
      <View style={{ height: 16 }} />
      <ThemedButton variant="secondary" onPress={() => disconnect(wallet)} title="Disconnect" />
    </View>
  ) : (
    <>
      {isAutoConnecting && <ThemedText type="subtext">Auto-connecting...</ThemedText>}
      <ConnectWithGoogle />
      <ConnectWithWallet walletId="me.rainbow" />
      <ConnectWithWallet walletId="io.metamask" />
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

const ConnectWithWallet = (props: { walletId: WalletId }) => {
  const { walletId } = props;
  const walletName = useWalletInfo(walletId)?.data?.name;
  const { connect, isConnecting } = useConnect();
  return (
    <ThemedButton
      title={`Connect with ${walletName}`}
      variant="secondary"
      loading={isConnecting}
      loadingTitle="Connecting..."
      onPress={() => {
        connect(async () => {
          const w = createWallet(walletId);
          await w.connect({
            client,
            walletConnect: {
              optionalChains: [base, polygon, ethereum, arbitrum],
            },
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
  tableContainer: {
    width: "100%",
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  leftColumn: {
    flex: 1,
    textAlign: "left",
  },
  rightColumn: {
    flex: 1,
    textAlign: "right",
  },
});
