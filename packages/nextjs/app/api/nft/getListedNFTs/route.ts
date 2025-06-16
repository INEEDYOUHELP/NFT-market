import { NextResponse } from 'next/server';
import { nftService } from '../../../../../mysql/nftService';

export async function GET() {
  try {
    // 获取所有已上架的 NFTs
    const nfts = await nftService.getListedNFTs();

    // 转换数据格式以匹配前端需求
    const formattedNFTs = nfts.map(nft => ({
      id: nft.token_id,
      tokenId: nft.token_id,
      name: nft.name,
      description: nft.description,
      image: nft.uri,
      uri: nft.uri,
      price: nft.price.toString(),
      owner: nft.owner,
      creator: nft.creator,
      attributes: [], // 如果需要属性数据，需要额外处理
      is_listed: nft.is_listed,
      royalty: nft.royalty,
      rarity: nft.rarity || 'Common',
    }));

    return NextResponse.json({ success: true, data: formattedNFTs });
  } catch (error) {
    console.error('获取上架 NFT 失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch listed NFTs',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 