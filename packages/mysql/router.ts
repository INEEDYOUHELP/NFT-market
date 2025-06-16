import express from 'express';
import { nftService } from './nftService';

const router = express.Router();

// 创建 NFT
router.post('/nft', async (req, res) => {
  try {
    const nftData = req.body;
    const result = await nftService.createNFT(nftData);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: '创建 NFT 失败' });
  }
});

// 更新 NFT 上架状态
router.put('/nft/:tokenId/listing', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { isListed, price } = req.body;
    const result = await nftService.updateListingStatus(Number(tokenId), isListed, price);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 NFT 上架状态失败' });
  }
});

// 更新 NFT 所有者
router.put('/nft/:tokenId/owner', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const { newOwner } = req.body;
    const result = await nftService.updateOwner(Number(tokenId), newOwner);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: '更新 NFT 所有者失败' });
  }
});

// 获取所有 NFT
router.get('/nfts', async (req, res) => {
  try {
    const nfts = await nftService.getAllNFTs();
    res.json({ success: true, data: nfts });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 NFT 列表失败' });
  }
});

// 获取指定 NFT
router.get('/nft/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;
    const nft = await nftService.getNFTByTokenId(Number(tokenId));
    if (!nft) {
      return res.status(404).json({ success: false, error: 'NFT 不存在' });
    }
    res.json({ success: true, data: nft });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取 NFT 详情失败' });
  }
});

// 获取用户拥有的 NFT
router.get('/nfts/owner/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const nfts = await nftService.getNFTsByOwner(address);
    res.json({ success: true, data: nfts });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取用户 NFT 列表失败' });
  }
});

// 获取已上架的 NFT
router.get('/nfts/listed', async (req, res) => {
  try {
    const nfts = await nftService.getListedNFTs();
    res.json({ success: true, data: nfts });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取上架 NFT 列表失败' });
  }
});

export default router;

