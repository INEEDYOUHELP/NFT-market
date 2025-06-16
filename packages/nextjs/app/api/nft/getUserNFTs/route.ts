import { NextResponse } from 'next/server';
import { nftService } from '../../../../../mysql/nftService';

export async function GET(request: Request) {
  try {
    // 从 URL 获取用户地址
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Address is required' },
        { status: 400 }
      );
    }

    // 获取用户的 NFTs
    const nfts = await nftService.getNFTsByOwner(address);

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
    console.error('获取用户 NFT 失败:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch NFTs',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    );
  }
} 