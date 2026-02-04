import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Trash2, FolderOpen, Image, Video, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/shared/Button';
import { Loading } from '../../components/shared/Loading';
import { ToastContainer } from '../../components/shared/Toast';
import { useToast } from '../../hooks/useToast';
import { eandColors } from '../../constants/eandColors';
import {
  createGameAssetsBucket,
  uploadAsset,
  deleteAsset,
  listAssets,
  getAssetUrl,
  ASSET_FOLDERS
} from '../../utils/storageSetup';

interface AssetFile {
  name: string;
  id: string;
  created_at: string;
  updated_at: string;
}

export function AssetManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string>(ASSET_FOLDERS.BACKGROUNDS);
  const [assets, setAssets] = useState<AssetFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    initializeBucket();
  }, []);

  useEffect(() => {
    if (bucketInitialized) {
      loadAssets();
    }
  }, [selectedFolder, bucketInitialized]);

  async function initializeBucket() {
    setLoading(true);
    const result = await createGameAssetsBucket();

    if (result.success) {
      setBucketInitialized(true);
      toast.success(result.message || 'Storage bucket ready');
    } else {
      toast.error(result.error || 'Failed to initialize storage');
    }
    setLoading(false);
  }

  async function loadAssets() {
    setLoading(true);
    const result = await listAssets(selectedFolder);

    if (result.success && result.data) {
      setAssets(result.data);
    } else {
      toast.error(result.error || 'Failed to load assets');
    }
    setLoading(false);
  }

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const file = files[0];
    const filePath = `${selectedFolder}/${Date.now()}_${file.name}`;

    const result = await uploadAsset(file, filePath);

    if (result.success) {
      toast.success('Asset uploaded successfully!');
      loadAssets();
    } else {
      toast.error(result.error || 'Failed to upload asset');
    }

    setUploading(false);
    event.target.value = '';
  }

  async function handleDelete(fileName: string) {
    if (!confirm('Are you sure you want to delete this asset?')) return;

    const filePath = `${selectedFolder}/${fileName}`;
    const result = await deleteAsset(filePath);

    if (result.success) {
      toast.success('Asset deleted successfully');
      loadAssets();
    } else {
      toast.error(result.error || 'Failed to delete asset');
    }
  }

  function copyToClipboard(path: string) {
    const url = getAssetUrl(`${selectedFolder}/${path}`);
    navigator.clipboard.writeText(url);
    toast.success('URL copied to clipboard!');
  }

  if (loading && !bucketInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: eandColors.lightGrey }}>
        <Loading />
      </div>
    );
  }

  return (
    <>
      <ToastContainer toasts={toast.toasts} onClose={toast.removeToast} />
      <div className="min-h-screen p-8" style={{ backgroundColor: eandColors.lightGrey }}>
        <div className="max-w-7xl mx-auto">
          <div className="mb-6">
            <Button onClick={() => navigate('/dashboard')} variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

        <div className="bg-white/90 backdrop-blur-md rounded-[2.5rem] p-8 border-2 shadow-2xl" style={{ borderColor: eandColors.mediumGrey }}>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2" style={{ color: eandColors.oceanBlue }}>Asset Manager</h1>
              <p style={{ color: eandColors.grey }}>Upload and manage game assets</p>
            </div>

            <label
              className="inline-flex items-center gap-2 px-4 py-2 font-semibold rounded-2xl transition-all duration-200 cursor-pointer text-white"
              style={{
                backgroundColor: uploading ? `${eandColors.red}80` : eandColors.red,
                cursor: uploading ? 'not-allowed' : 'pointer'
              }}
            >
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              <Upload className="w-5 h-5" />
              {uploading ? 'Uploading...' : 'Upload Asset'}
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 mb-8">
            {Object.entries(ASSET_FOLDERS).map(([key, folder]) => (
              <button
                key={folder}
                onClick={() => setSelectedFolder(folder)}
                className="p-4 rounded-3xl border-2 transition-all transform hover:scale-105"
                style={
                  selectedFolder === folder
                    ? {
                        background: `linear-gradient(135deg, ${eandColors.red} 0%, ${eandColors.oceanBlue} 100%)`,
                        borderColor: eandColors.red,
                        color: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                      }
                    : {
                        backgroundColor: 'white',
                        borderColor: eandColors.mediumGrey,
                        color: eandColors.oceanBlue,
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                      }
                }
              >
                <FolderOpen className="w-6 h-6 mx-auto mb-2" />
                <div className="text-sm font-medium capitalize">{folder}</div>
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loading />
            </div>
          ) : assets.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-lg mb-2" style={{ color: eandColors.grey }}>No assets in this folder</div>
              <div className="text-sm" style={{ color: eandColors.mediumGrey }}>Upload your first asset to get started</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
              {assets.map((asset) => {
                const isVideo = asset.name.match(/\.(mp4|webm)$/i);
                const assetUrl = getAssetUrl(`${selectedFolder}/${asset.name}`);

                return (
                  <div
                    key={asset.id}
                    className="bg-white rounded-3xl overflow-hidden border-2 transition-all group shadow-lg hover:shadow-xl transform hover:scale-105"
                    style={{ borderColor: eandColors.mediumGrey }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = eandColors.red}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = eandColors.mediumGrey}
                  >
                    <div className="aspect-square bg-gray-50 flex items-center justify-center relative overflow-hidden">
                      {isVideo ? (
                        <Video className="w-12 h-12" style={{ color: eandColors.mediumGrey }} />
                      ) : (
                        <img
                          src={assetUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      )}
                    </div>

                    <div className="p-3">
                      <div className="text-sm font-medium truncate mb-2" style={{ color: eandColors.oceanBlue }} title={asset.name}>
                        {asset.name}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(asset.name)}
                          className="flex-1 px-3 py-2 text-white rounded-2xl text-xs font-medium transition-colors shadow-md"
                          style={{ backgroundColor: eandColors.oceanBlue }}
                        >
                          Copy URL
                        </button>

                        <button
                          onClick={() => handleDelete(asset.name)}
                          className="px-3 py-2 text-white rounded-2xl transition-colors shadow-md"
                          style={{ backgroundColor: eandColors.red }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white/90 backdrop-blur-md rounded-3xl p-6 border-2 shadow-lg" style={{ borderColor: eandColors.mediumGrey }}>
          <h2 className="font-semibold mb-3" style={{ color: eandColors.oceanBlue }}>Asset Folders</h2>
          <div className="text-sm space-y-2" style={{ color: eandColors.grey }}>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>icons/</span> - Game icons and UI elements</div>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>backgrounds/</span> - Background images and videos</div>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>islands/</span> - Island terrain images</div>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>themes/</span> - Theme-specific assets</div>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>avatars/</span> - Player avatars</div>
            <div><span className="font-medium" style={{ color: eandColors.oceanBlue }}>videos/</span> - Video assets</div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
