import { useEffect, useState } from "react";
import { NFTCard } from "./NFTCard";
import { useAccount } from "wagmi";
import { useScaffoldContract, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification, message, Switch, Pagination } from "antd";
import { ethers } from "ethers";

export interface Collectible {
  image: string;
  id: number;
  name: string;
  attributes: { trait_type: string; value: string }[];
  owner: string;
  creator: string;
  price: string;
  description: string;
  uri?: string;
  tokenId?: number;
  CID?: string;
  is_listed?: boolean;
}

interface MyHoldingsProps {
  shouldRefresh?: boolean;
  onRefreshComplete?: () => void;
}

export const MyHoldings = ({ shouldRefresh, onRefreshComplete }: MyHoldingsProps) => {
  const { address: connectedAddress } = useAccount();
  const [myAllCollectibles, setMyAllCollectibles] = useState<Collectible[]>([]);
  const [allCollectiblesLoading, setAllCollectiblesLoading] = useState(false);
  const [isListed, setIsListed] = useState<{ [key: number]: boolean }>({});
  const [price, setPrice] = useState<{ [key: number]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const { writeAsync: listItem } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "listItem",
    args: [0n, 0n],
  });

  const { writeAsync: unlistItem } = useScaffoldContractWrite({
    contractName: "YourCollectible",
    functionName: "unlistItem",
    args: [0n],
  });

  const fetchNFTs = async () => {
    if (!connectedAddress) return;

    setAllCollectiblesLoading(true);
    try {
      const response = await fetch(`/api/nft/getUserNFTs?address=${connectedAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-cache',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch NFTs');
      }

      if (data.success && Array.isArray(data.data)) {
        setMyAllCollectibles(data.data);
        
        // 设置上架状态
        const listedState: { [key: number]: boolean } = {};
        const priceState: { [key: number]: string } = {};
        data.data.forEach((nft: Collectible) => {
          if (nft.is_listed) {
            listedState[nft.id] = true;
            priceState[nft.id] = nft.price;
          }
        });
        setIsListed(listedState);
        setPrice(priceState);
      }
    } catch (error) {
      console.error('获取 NFT 失败:', error);
      notification.error({
        message: '获取 NFT 失败',
        description: error instanceof Error ? error.message : '未知错误'
      });
    } finally {
      setAllCollectiblesLoading(false);
      onRefreshComplete?.();
    }
  };

  // 监听地址变化
  useEffect(() => {
    fetchNFTs();
  }, [connectedAddress]);

  // 监听刷新信号
  useEffect(() => {
    if (shouldRefresh) {
      fetchNFTs();
    }
  }, [shouldRefresh]);

  const handleTransferSuccess = async (id: number) => {
    await fetchNFTs();
  };

  const handleListToggle = async (checked: boolean, id: number) => {
    try {
      if (!price[id] && checked) {
        message.error("请设置价格");
        return;
      }

      // 先调用合约
      if (checked) {
        // 上架
        await listItem({
          args: [BigInt(id), ethers.parseUnits(price[id], "ether")],
        });
      } else {
        // 下架
        await unlistItem({
          args: [BigInt(id)],
        });
      }

      // 再更新数据库
      const response = await fetch('/api/nft/updateListing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token_id: id,
          is_listed: checked,
          price: checked ? price[id] : null
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '更新上架状态失败');
      }

      setIsListed(prev => ({ ...prev, [id]: checked }));
      message.success(checked ? "上架成功" : "下架成功");
    } catch (error) {
      console.error('更新上架状态失败:', error);
      message.error(error instanceof Error ? error.message : '更新失败');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedNFTs = myAllCollectibles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <>
      {myAllCollectibles.length === 0 ? (
        <div className="flex justify-center items-center mt-10">
          <div className="text-2xl text-primary-content">No NFTs found</div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-4 my-8 px-5 justify-center">
          {paginatedNFTs.map((item) => (
            <div key={item.id}>
              <NFTCard nft={item} onTransferSuccess={handleTransferSuccess} />
              <div className="card-actions justify-center">
                <div className="flex flex-row items-center">
                  <span className="mr-3">上架</span>
                  <Switch checked={isListed[item.id] || false} onChange={(checked: any) => handleListToggle(checked, item.id)} />
                  <input
                    type="text"
                    value={price[item.id] || ""}
                    onChange={(e) => setPrice(prev => ({ ...prev, [item.id]: e.target.value }))}
                    placeholder="Price in ETH"
                    disabled={isListed[item.id]}
                    className="border ml-3 p-2"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination
        current={currentPage}
        pageSize={itemsPerPage}
        total={myAllCollectibles.length}
        onChange={handlePageChange}
        style={{ marginTop: "2rem", textAlign: "center" }}
      />
    </>
  );
};
