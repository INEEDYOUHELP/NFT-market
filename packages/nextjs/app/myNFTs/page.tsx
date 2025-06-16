"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { MyHoldings } from "~~/components/simpleNFT";
import { useScaffoldContractRead, useScaffoldContractWrite, useScaffoldContract } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";
import { addToIPFS } from "~~/utils/simpleNFT/ipfs-fetch";
import { RainbowKitCustomConnectButton } from "~~/components/scaffold-eth";

interface NftInfo {
  image: string;
  id: number;
  name: string;
  description: string;
  price: string;
  royalty: string;
  owner: string;
  attributes: { trait_type: string; value: string }[];
  CID?: string;
}

const MyNFTs: NextPage = () => {
  const { address: connectedAddress, isConnected, isConnecting } = useAccount();
  const { data: contract } = useScaffoldContract({
    contractName: "YourCollectible",
  });
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const [nftInfo, setNftInfo] = useState<NftInfo>({
    image: "",
    id: Date.now(),
    name: "",
    description: "",
    price: "",
    royalty: "10", // 默认版税 10%，显示为百分比
    owner: connectedAddress || "",
    attributes: [],
  });
  const [createdNFTs, setCreatedNFTs] = useState<NftInfo[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { writeAsync: mintItem } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "mintItem",
    args: [
      connectedAddress,
      nftInfo.name,
      nftInfo.description,
      nftInfo.image,
      BigInt(nftInfo.price || 0),
      BigInt(Number(nftInfo.royalty) * 100) // 将百分比转换为基点
    ],
  });

  const { data: tokenIdCounter } = useScaffoldContractRead({
    contractName: "YourCollectible",
    functionName: "tokenIdCounter",
    watch: true,
    cacheOnBlock: true,
  });

  const handleNftInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "royalty") {
      // 确保版税不超过100%
      const royaltyValue = Math.min(Number(value), 100);
      setNftInfo({
        ...nftInfo,
        [name]: royaltyValue.toString(),
      });
    } else {
      setNftInfo({
        ...nftInfo,
        [name]: name === "attributes" ? value.split(",").map((attr) => ({ trait_type: name, value: attr })) : value,
      });
    }
  };

  const handleMintItem = async () => {
    const { image, name, attributes, price, description, royalty } = nftInfo;
    if (image === "") {
      notification.error("请提供图片链接");
      return;
    }

    const notificationId = notification.loading("上传至IPFS中...");
    try {
      const uploadedItem = await addToIPFS({ 
        image, 
        id: Date.now(), 
        name, 
        attributes, 
        owner: connectedAddress || "", 
        price, 
        description,
        royalty 
      });

      if (!uploadedItem || !uploadedItem.imageUrl) {
        throw new Error("IPFS 上传失败或未返回有效图片路径");
      }

      notification.remove(notificationId);
      notification.success("数据已上传到IPFS中");

      if (tokenIdCounter !== undefined) {
        const tx = await mintItem({
          args: [
            connectedAddress,
            name,
            description,
            uploadedItem.path,
            BigInt(price || 0),
            BigInt(Number(royalty) * 100)
          ],
        });

        // 等待交易被挖矿
        notification.info("等待交易确认中...");
        
        // 等待2秒确保交易被广播
        await new Promise(resolve => setTimeout(resolve, 2000));

        // 获取新的 tokenId
        const newId = Number(tokenIdCounter) + 1;

        // 保存到数据库
        try {
          const nftDataToSave = {
            token_id: newId,
            name: name,
            description: description || '',
            uri: uploadedItem.imageUrl,
            price: Number(price) || 0,
            royalty: Number(royalty) * 100,
            creator: connectedAddress || '',
            owner: connectedAddress || '',
            rarity: "Common",
            is_listed: false,
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000)
          };

          console.log('Saving NFT data:', nftDataToSave);

          const response = await fetch('/api/nft/create', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(nftDataToSave),
          });

          const data = await response.json();

          if (!response.ok) {
            console.error('数据库保存失败. 发送的数据:', nftDataToSave);
            console.error('服务器响应:', data);
            throw new Error(data.error || 'Failed to save NFT to database');
          }

          notification.success("NFT数据已保存到数据库");
          setShouldRefresh(true);

          // 重置表单
          setNftInfo({
            image: "",
            id: Date.now(),
            name: "",
            description: "",
            price: "",
            royalty: "10",
            owner: connectedAddress || "",
            attributes: [],
          });
          setIsModalOpen(false);
        } catch (error) {
          console.error("保存NFT到数据库失败:", error);
          notification.error(error instanceof Error ? error.message : "保存NFT到数据库失败");
        }
      } else {
        notification.error("无法获取TokenIdCounter");
      }
    } catch (error) {
      notification.remove(notificationId);
      console.error("铸造NFT出错: ", error);
      notification.error("铸造NFT失败");
    }
  };

  useEffect(() => {
    const storedNFTs = localStorage.getItem("createdNFTs");
    if (storedNFTs) {
      setCreatedNFTs(JSON.parse(storedNFTs));
    }
  }, [connectedAddress]);

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">我的NFT列表</span>
          </h1>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <button className="btn btn-secondary" onClick={() => setIsModalOpen(true)}>
          创建NFT
        </button>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-800 bg-opacity-50">
          <div className="bg-white p-8 rounded-lg shadow-lg relative">
            <button className="absolute right-3 top-3 text-lg" onClick={() => setIsModalOpen(false)} style={{ color: "black" }}>
              -
            </button>
            <div>
              <input
                type="text"
                name="name"
                placeholder="NFT 名称"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.name}
                onChange={handleNftInfoChange}
              />
              <textarea
                name="description"
                placeholder="NFT 描述"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.description}
                onChange={(e) => handleNftInfoChange(e as any)}
                rows={3}
              />
              <input
                type="text"
                name="image"
                placeholder="NFT 图片链接 (IPFS)"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.image}
                onChange={handleNftInfoChange}
              />
              <input
                type="number"
                name="price"
                placeholder="NFT 价格 (ETH)"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.price}
                onChange={handleNftInfoChange}
                min="0"
                step="0.000000000000000001"
              />
              <div className="relative">
                <input
                  type="number"
                  name="royalty"
                  placeholder="版税比例 (0-100)"
                  className="border p-2 w-200 mb-4 block mx-auto pr-8"
                  value={nftInfo.royalty}
                  onChange={handleNftInfoChange}
                  min="0"
                  max="100"
                />
                <span className="absolute right-12 top-2 text-gray-500">%</span>
              </div>
              <input
                type="text"
                name="attributes"
                placeholder="NFT 属性（用逗号分隔）"
                className="border p-2 w-200 mb-4 block mx-auto"
                value={nftInfo.attributes.map((attr) => attr.value).join(",")}
                onChange={handleNftInfoChange}
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                className="btn btn-secondary mr-4"
                onClick={() => {
                  setIsModalOpen(false);
                  setNftInfo({
                    image: "",
                    id: Date.now(),
                    name: "",
                    description: "",
                    price: "",
                    royalty: "10",
                    owner: connectedAddress || "",
                    attributes: [],
                  });
                }}
              >
                取消
              </button>
              <div className="flex justify-center">
                {!isConnected || isConnecting ? (
                  <RainbowKitCustomConnectButton />
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => {
                      handleMintItem();
                      setIsModalOpen(false);
                    }}
                  >
                    创建 NFT
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <MyHoldings shouldRefresh={shouldRefresh} onRefreshComplete={() => setShouldRefresh(false)} />
    </>
  );
};

export default MyNFTs;
