"use client";
import { useState } from "react";
import { Address } from "../scaffold-eth";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification, Modal } from "antd";
import { ethers } from "ethers";
import { useAccount } from "wagmi";

export interface NFTCardProps {
  nft: any;
  onTransferSuccess?: (id: number) => void;
  showOwner?: boolean;
  showPurchase?: boolean;
}

export const NFTCard = ({ nft, onTransferSuccess, showOwner = true, showPurchase = false }: NFTCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [nftDetails] = useState(nft);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const { writeAsync: purchase } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [0n],
  });

  const handleTransfer = async () => {
    if (!connectedAddress) {
      notification.error({
        message: "错误",
        description: "请先连接钱包",
      });
      return;
    }

    try {
      const price = ethers.parseUnits(nftDetails.price, "ether");
      await purchase({
        args: [BigInt(nftDetails.id)],
        value: price,
      });

      // 更新数据库中的 NFT 所有者
      const response = await fetch('/api/nft/updateOwner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: nftDetails.id,
          new_owner: connectedAddress
        }),
      });

      if (!response.ok) {
        throw new Error('更新所有者失败');
      }

      if (onTransferSuccess) {
        onTransferSuccess(nftDetails.id);
      }

      setIsModalVisible(false);
      notification.success({ message: "购买成功" });
    } catch (error) {
      console.error('购买失败:', error);
      notification.error({
        message: "购买失败",
        description: error instanceof Error ? error.message : "未知错误"
      });
    }
  };

  const showConfirmModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  return (
    <>
      <div className={`card w-96 shadow-xl transition-all duration-300 ${
        nftDetails.rarity === 'Common' ? 'bg-base-100 border border-gray-300' :
        nftDetails.rarity === 'Rare' ? 'bg-gradient-to-br from-blue-100 to-white border-2 border-blue-500' :
        nftDetails.rarity === 'Epic' ? 'bg-gradient-to-br from-purple-100 to-white border-2 border-purple-500' :
        nftDetails.rarity === 'Legendary' ? 'bg-gradient-to-br from-yellow-100 to-white border-2 border-yellow-500 animate-pulse' :
        'bg-base-100'
      }`}>
        <figure className="relative">
          <img src={nftDetails.image} alt={nftDetails.name} className="h-64 object-cover" />
          <div className={`absolute top-2 right-2 px-3 py-1 rounded-full font-bold ${
            nftDetails.rarity === 'Common' ? 'bg-gray-200 text-gray-700' :
            nftDetails.rarity === 'Rare' ? 'bg-blue-200 text-blue-700' :
            nftDetails.rarity === 'Epic' ? 'bg-purple-200 text-purple-700' :
            nftDetails.rarity === 'Legendary' ? 'bg-yellow-200 text-yellow-700' :
            'bg-gray-200 text-gray-700'
          }`}>
            {nftDetails.rarity}
          </div>
        </figure>
        <div className="card-body">
          <div className="flex items-center justify-center">
            <p className="text-xl p-0 m-0 font-semibold">{nftDetails.name}</p>
            <div className="flex flex-wrap space-x-2 mt-1">
              {nftDetails.attributes?.map((attr: { trait_type: string; value: string }, index: number) => (
                <span key={index} className="badge badge-primary py-3">
                  {attr.trait_type}: {attr.value}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center mt-1">
            <p className="my-0 text-lg">{nftDetails.description}</p>
          </div>
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">创作者 : </span>
            <Address address={nftDetails.creator} />
          </div>
          {showOwner && (
            <div className="flex space-x-3 mt-1 items-center">
              <span className="text-lg font-semibold">拥有者 : </span>
              <Address address={nftDetails.owner} />
            </div>
          )}
          {nftDetails.CID && (
            <div className="flex space-x-3 mt-1 items-center">
              <span className="text-lg font-semibold">CID : </span>
              <span>{nftDetails.CID}</span>
            </div>
          )}
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">价格 : </span>
            <span>{nftDetails.price} ETH</span>
          </div>
          <div className="flex space-x-3 mt-1 items-center">
            <span className="text-lg font-semibold">稀有度 : </span>
            <span className={`
              ${nftDetails.rarity === 'Common' ? 'text-gray-500 bg-gray-100' : ''}
              ${nftDetails.rarity === 'Rare' ? 'text-blue-500 bg-blue-100' : ''}
              ${nftDetails.rarity === 'Epic' ? 'text-purple-500 bg-purple-100' : ''}
              ${nftDetails.rarity === 'Legendary' ? 'text-yellow-500 bg-yellow-100' : ''}
              font-bold px-2 py-1 rounded-lg
            `}>
              {nftDetails.rarity}
            </span>
          </div>
          {showPurchase && (
            <div className="card-actions justify-end">
              <button
                className="btn btn-secondary btn-md px-8 tracking-wide"
                onClick={showConfirmModal}
                style={{ margin: "0px auto" }}
              >
                购买
              </button>
            </div>
          )}
        </div>
      </div>

      <Modal
        title="确认购买"
        open={isModalVisible}
        onOk={handleTransfer}
        onCancel={handleCancel}
        okText="确认"
        cancelText="取消"
      >
        <div className="text-black">
          <p>您确定要购买此 NFT 吗？</p>
          <p>名称：{nftDetails.name}</p>
          <p>价格：{nftDetails.price} ETH</p>
          <p>稀有度：{nftDetails.rarity}</p>
        </div>
      </Modal>
    </>
  );
};
