"use client";

import { useState, useEffect } from "react";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Modal, Button, notification, Pagination, Input } from "antd";
import { Address } from "~~/components/scaffold-eth";
import { NFTCard } from "~~/components/simpleNFT/NFTCard";
import { useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { ethers } from "ethers";

interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  description: string;
  CID: string;
}

interface ListedNftInfo {
  id: number;
  price: string;
}

const AllNFTs: NextPage = () => {
  const { address: connectedAddress } = useAccount();
  const [allNFTs, setAllNFTs] = useState<Collectible[]>([]);
  const [filteredNFTs, setFilteredNFTs] = useState<Collectible[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedNft, setSelectedNft] = useState<Collectible | null>(null);
  const [buyerAddresses, setBuyerAddresses] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [searchText, setSearchText] = useState("");
  const itemsPerPage = 6;

  const { writeAsync: purchase } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "purchase",
    args: [0n, '', '', 0n, 0n], // 初始默认参数
  });

  // 获取已上架的 NFTs
  const fetchListedNFTs = async () => {
    try {
      const response = await fetch('/api/nft/getListedNFTs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch listed NFTs');
      }

      if (data.success && Array.isArray(data.data)) {
        setAllNFTs(data.data);
        setFilteredNFTs(data.data);
      }
    } catch (error) {
      console.error('获取上架 NFT 失败:', error);
      notification.error({
        message: '获取上架 NFT 失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    }
  };

  // 初始加载和定期刷新
  useEffect(() => {
    fetchListedNFTs();
    const interval = setInterval(fetchListedNFTs, 30000); // 每30秒刷新一次

    return () => clearInterval(interval);
  }, []);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (value.trim() === "") {
      setFilteredNFTs(allNFTs);
    } else {
      const filtered = allNFTs.filter((nft) =>
        nft.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredNFTs(filtered);
      setCurrentPage(1); // 重置到第一页
    }
  };

  useEffect(() => {
    const filtered = allNFTs.filter((nft) =>
      nft.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredNFTs(filtered);
    setCurrentPage(1); // 重置到第一页
  }, [searchText, allNFTs]);

  const openModal = (nft: Collectible) => {
    setSelectedNft(nft);
    setIsModalOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getPriceById = (id: number) => {
    const nft = allNFTs.find(nft => nft.id === id);
    return nft ? nft.price : "N/A";
  };

  const handlePurchase = async () => {
    if (!selectedNft || !buyerAddresses[selectedNft.id]) return;

    try {
      const price = selectedNft.price;
      const value = ethers.parseUnits(price, "ether");
      await purchase({
        args: [BigInt(selectedNft.id), selectedNft.owner, buyerAddresses[selectedNft.id], value, BigInt(1)],
        value,
      });
      notification.success({ message: "购买成功" });

      // 更新数据库中的 NFT 所有者
      const response = await fetch('/api/nft/updateOwner', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: selectedNft.id,
          new_owner: buyerAddresses[selectedNft.id]
        }),
      });

      if (!response.ok) {
        console.error('更新所有者失败');
      }

      // 刷新列表
      fetchListedNFTs();
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      notification.error({ message: "购买失败" });
    }
  };

  const handleBuyerAddressChange = (id: number, address: string) => {
    setBuyerAddresses(prevAddresses => ({
      ...prevAddresses,
      [id]: address,
    }));
  };

  const handleTransferSuccess = async (id: number) => {
    // 刷新列表
    await fetchListedNFTs();
    setIsModalOpen(false);
  };

  // 分页后的数据
  const paginatedNFTs = filteredNFTs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      <div className="flex items-center flex-col pt-10">
        <div className="px-5">
          <h1 className="text-center mb-8">
            <span className="block text-4xl font-bold">NFT市场</span>
          </h1>
          <div className="flex justify-center mb-8">
            <Input.Search
              placeholder="输入NFT名称"
              value={searchText}
              onChange={(e: any) => setSearchText(e.target.value)}
              onSearch={handleSearch}
              enterButton
              style={{ width: 400 }}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center">
          {paginatedNFTs.length === 0 ? (
            <div className="text-2xl text-primary-content">暂无在售NFT</div>
          ) : (
            paginatedNFTs.map((nft) => (
              <div key={nft.id} className="mb-4">
                <NFTCard
                  nft={nft}
                  onTransferSuccess={handleTransferSuccess}
                  showOwner={true}
                  showPurchase={true}
                />
              </div>
            ))
          )}
        </div>
        <Pagination
          current={currentPage}
          pageSize={itemsPerPage}
          total={filteredNFTs.length}
          onChange={handlePageChange}
          style={{ marginTop: "2rem", textAlign: "center" }}
        />
      </div>

      <Modal
        title="确认购买"
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            onClick={handlePurchase}
          >
            确认购买
          </Button>,
        ]}
      >
        {selectedNft && (
          <div>
            <p>您将购买以下NFT：</p>
            <p>名称: {selectedNft.name}</p>
            <p>价格: {getPriceById(selectedNft.id)} ETH</p>
          </div>
        )}
      </Modal>
    </>
  );
};

export default AllNFTs;
