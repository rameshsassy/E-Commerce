import React, { useState, useEffect, useRef, useCallback } from 'react';
import api, { BASE_URL } from '../../utils/api';
import {
  Upload,
  FileSpreadsheet,
  Image as ImageIcon,
  List,
  CheckCircle,
  Clock,
  XCircle,
  Edit2,
  Trash2,
  X,
  Store,
  MessageCircle,
  Zap,
} from 'lucide-react';
import StoreFormFields, { isStoreFormValid } from '../../components/seller/StoreFormFields';
import useFormAutosave from '../../hooks/useFormAutosave';
import FormAutosaveStatus from '../../components/common/FormAutosaveStatus';
import UpgradePremiumModal from '../../components/seller/UpgradePremiumModal';
import ApprovedProductLockBanner from '../../components/seller/ApprovedProductLockBanner';
import {
  isProductLocked,
  getProductLockMessage,
  getApiLockPayload,
} from '../../utils/productLock';
import { getApprovedProductWhatsAppUrl } from '../../utils/supportContact';
import ProductBasicFields from '../../components/seller/ProductBasicFields';
import ProductPremiumCategoryKeywordsFields from '../../components/seller/ProductPremiumCategoryKeywordsFields';
import {
  isProductFormContentValid,
  normalizePoliciesForSave,
  clonePolicies,
} from '../../utils/productContentValidation';
import { validateFreeSellerCategorySelection } from '../../utils/sellerCategoryPath';

const defaultProductData = {
  title: '', description: '', price: '', compareAtPrice: '', unitPrice: '', chargeTax: false, category: '', stock: 0,
  locations: [{ address: 'Main Shop Location', stock: 0 }], keywords: '',
  premiumType: '',
  inventoryTracked: true, sku: '', purchaseType: 'one_time', shipFromStoreAddresses: [],
  barcode: '', continueSellingWhenOutOfStock: false,
  isPhysicalProduct: true, packageType: 'Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg',
  packageLength: '', packageWidth: '', packageHeight: '', packageDimensionsUnit: 'cm',
  productWeight: 0, productWeightUnit: 'g',
  deliveryBy: '', deliveryInput: '', deliveryValues: [],
  pageTitle: '', metaDescription: '', urlHandle: '',
  policies: {
    return: { enabled: false, terms: '' },
    replacement: { enabled: false, terms: '' },
    refund: { enabled: false, terms: '' },
  },
  careInstructions: '',
  keyHighlights: '',
  dispatchDeliveryDays: '',
  minOrderQuantity: 1,
  maxOrderQuantity: 5,
  bulkPurchaseEnabled: false,
  bulkPurchaseMinOrderQuantity: 50,
  variants: [],
};

const SellerProducts = () => {
  const [activeTab, setActiveTab] = useState('list');
  
  // My Products State
  const [myProducts, setMyProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  
  // Edit State
  const [editingProduct, setEditingProduct] = useState(null);

  const [productData, setProductData] = useState(defaultProductData);
  const [productImages, setProductImages] = useState([]);
  const [singleLoading, setSingleLoading] = useState(false);
  const [singleMsg, setSingleMsg] = useState('');
  const [inventoryOptions, setInventoryOptions] = useState(null);

  // Autosave draft (new product only)
  const [draftId, setDraftId] = useState(null);
  const [autoSaving, setAutoSaving] = useState(false);
  const [autoSaveMsg, setAutoSaveMsg] = useState('');
  const skipNextAutosaveRef = useRef(false);
  const hydratedDraftRef = useRef(false);
  const lastAutosaveSignatureRef = useRef('');

  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState('premium');
  const [upgradeAutoRedirect, setUpgradeAutoRedirect] = useState(false);
  const [actionOpenId, setActionOpenId] = useState(null);

  const openUpgradeModal = (feature = 'premium', { autoRedirect = false } = {}) => {
    setUpgradeFeature(feature);
    setUpgradeAutoRedirect(autoRedirect);
    setUpgradeModalOpen(true);
  };

  const fetchMyProducts = async () => {
    setLoadingProducts(true);
    try {
      const { data } = await api.get('/seller/products');
      setMyProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      fetchMyProducts();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'single') {
      api.get('/seller/products/inventory-options')
        .then(({ data }) => setInventoryOptions(data))
        .catch((err) => console.error('Inventory options:', err));
    }
  }, [activeTab]);

  // Restore autosaved draft when opening "Add Single Product" (new products only)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (activeTab !== 'single') return;
      if (editingProduct) {
        hydratedDraftRef.current = true;
        skipNextAutosaveRef.current = false;
        return;
      }

      // Prevent autosave while we are hydrating state from backend.
      skipNextAutosaveRef.current = true;
      hydratedDraftRef.current = false;

      try {
        const { data } = await api.get('/seller/products/draft');
        if (cancelled) return;

        if (data?.draft) {
          const d = data.draft;
          setDraftId(d._id);
          setProductData({
            ...defaultProductData,
            title: d.title || '',
            description: d.description || '',
            price: d.price ?? '',
            compareAtPrice: d.compareAtPrice ?? '',
            unitPrice: d.unitPrice ?? '',
            chargeTax: Boolean(d.chargeTax),
            category: d.category || '',
            premiumType: d.premiumType || '',
            stock: d.stock ?? 0,
            locations:
              Array.isArray(d.locations) && d.locations.length > 0
                ? d.locations
                : defaultProductData.locations,
            inventoryTracked: d.inventoryTracked !== undefined ? d.inventoryTracked : true,
            sku: d.sku || '',
            purchaseType: d.purchaseType || 'one_time',
            shipFromStoreAddresses: d.shipFromStoreAddresses || [],
            barcode: d.barcode || '',
            continueSellingWhenOutOfStock: d.continueSellingWhenOutOfStock || false,
            isPhysicalProduct: d.isPhysicalProduct !== undefined ? d.isPhysicalProduct : true,
            packageType: d.packageType || defaultProductData.packageType,
            packageLength: d.packageLength ?? '',
            packageWidth: d.packageWidth ?? '',
            packageHeight: d.packageHeight ?? '',
            packageDimensionsUnit: d.packageDimensionsUnit || 'cm',
            productWeight: d.productWeight ?? 0,
            productWeightUnit: d.productWeightUnit || 'g',
            deliveryBy: d.deliveryBy || '',
            deliveryInput: '',
            deliveryValues: d.deliveryValues || [],
            pageTitle: d.pageTitle || '',
            metaDescription: d.metaDescription || '',
            urlHandle: d.urlHandle || '',
            keywords: Array.isArray(d.keywords) ? d.keywords.join(', ') : '',
            policies: clonePolicies(d.policies || {}),
            careInstructions: d.careInstructions || '',
            keyHighlights: d.keyHighlights || '',
            dispatchDeliveryDays: d.dispatchDeliveryDays ?? '',
            minOrderQuantity: d.minOrderQuantity ?? 1,
            maxOrderQuantity: d.maxOrderQuantity ?? 5,
            bulkPurchaseEnabled: d.bulkPurchaseEnabled === true,
            bulkPurchaseMinOrderQuantity: d.bulkPurchaseMinOrderQuantity ?? 50,
            variants: (d.variants || []).map((v) => ({
              type: v.type,
              value: v.value,
              colorHex: v.colorHex || '',
              price: v.price ?? '',
              compareAtPrice: v.compareAtPrice ?? '',
              sku: v.sku || '',
              dispatchDeliveryDays: v.dispatchDeliveryDays ?? '',
              image: v.image || '',
              imageFile: null,
              imagePreview: '',
            })),
          });
          setProductImages(
            (d.images || []).map((imgPath, i) => ({
              id: `existing-${i}`,
              preview: `${BASE_URL}/${String(imgPath).replace(/\\/g, '/')}`,
              existingPath: imgPath,
            }))
          );

          // Prevent an immediate autosave right after draft restore.
          lastAutosaveSignatureRef.current = JSON.stringify({
            title: d.title || '',
            descriptionLen: String(d.description || '').length,
            price: d.price ?? '',
            compareAtPrice: d.compareAtPrice ?? '',
            unitPrice: d.unitPrice ?? '',
            chargeTax: Boolean(d.chargeTax),
            category: d.category || '',
            premiumType: d.premiumType || '',
            keywords: Array.isArray(d.keywords) ? d.keywords.join(', ') : '',
            dispatchDeliveryDays: d.dispatchDeliveryDays ?? '',
            minOrderQuantity: d.minOrderQuantity ?? 1,
            maxOrderQuantity: d.maxOrderQuantity ?? 5,
            bulkPurchaseEnabled: d.bulkPurchaseEnabled === true,
            bulkPurchaseMinOrderQuantity: d.bulkPurchaseMinOrderQuantity ?? 50,
            purchaseType: d.purchaseType || 'one_time',
            deliveryBy: d.deliveryBy || '',
            deliveryValues: d.deliveryValues || [],
            shipFromStoreAddresses: d.shipFromStoreAddresses || [],
            policies: d.policies || {},
            variants: (d.variants || []).map((v) => ({
              type: v.type,
              value: v.value,
              colorHex: v.colorHex || '',
              price: v.price ?? '',
              compareAtPrice: v.compareAtPrice ?? '',
              sku: v.sku || '',
              dispatchDeliveryDays: v.dispatchDeliveryDays ?? '',
              image: v.image || '',
            })),
          });
        } else {
          setDraftId(null);
          setProductData({ ...defaultProductData });
          setProductImages([]);
        }
      } catch (err) {
        console.error('Draft restore failed:', err);
      } finally {
        if (!cancelled) {
          hydratedDraftRef.current = true;
          // Let the next user change trigger autosave.
          setTimeout(() => {
            skipNextAutosaveRef.current = false;
          }, 0);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [activeTab, editingProduct]);

  // Autosave while typing (new product + edit)
  useEffect(() => {
    if (activeTab !== 'single') return;
    if (!hydratedDraftRef.current) return;
    if (skipNextAutosaveRef.current) return;

    const timeoutId = setTimeout(async () => {
      try {
        if (autoSaving) return;

        const hasAnyInput =
          String(productData.title || '').trim() !== '' ||
          String(productData.description || '').trim() !== '' ||
          (productData.price !== '' && productData.price !== undefined) ||
          String(productData.category || '').trim() !== '' ||
          String(productData.keywords || '').trim() !== '' ||
          productImages.some((img) => Boolean(img.file)) ||
          (productData.variants || []).some(
            (v) =>
              String(v?.value || '').trim() !== '' ||
              Boolean(v?.imageFile) ||
              String(v?.image || '').trim() !== ''
          );

        if (!hasAnyInput) return;

        const currentSignature = JSON.stringify({
          title: productData.title || '',
          descriptionLen: String(productData.description || '').length,
          price: productData.price ?? '',
          compareAtPrice: productData.compareAtPrice ?? '',
          unitPrice: productData.unitPrice ?? '',
          chargeTax: Boolean(productData.chargeTax),
          category: productData.category || '',
          premiumType: productData.premiumType || '',
          keywords: productData.keywords || '',
          dispatchDeliveryDays: productData.dispatchDeliveryDays ?? '',
          minOrderQuantity: productData.minOrderQuantity ?? 1,
          maxOrderQuantity: productData.maxOrderQuantity ?? 5,
          bulkPurchaseEnabled: productData.bulkPurchaseEnabled === true,
          bulkPurchaseMinOrderQuantity: productData.bulkPurchaseMinOrderQuantity ?? 50,
          purchaseType: productData.purchaseType || 'one_time',
          deliveryBy: productData.deliveryBy || '',
          deliveryValues: productData.deliveryValues || [],
          shipFromStoreAddresses: productData.shipFromStoreAddresses || [],
          policies: productData.policies || {},
          variants: (productData.variants || []).map((v) => ({
            type: v?.type,
            value: v?.value,
            colorHex: v?.colorHex || '',
            price: v?.price ?? '',
            compareAtPrice: v?.compareAtPrice ?? '',
            sku: v?.sku || '',
            dispatchDeliveryDays: v?.dispatchDeliveryDays ?? '',
            image: v?.image || '',
          })),
        });

        if (currentSignature === lastAutosaveSignatureRef.current) return;

        // Prepare FormData like final submit, but allow partial/empty values.
        const formData = new FormData();
        const policiesForSave = normalizePoliciesForSave(productData.policies);
        const payload = { ...productData, policies: policiesForSave };

        Object.keys(payload).forEach((key) => {
          if (
            key === 'locations' ||
            key === 'shipFromStoreAddresses' ||
            key === 'deliveryValues' ||
            key === 'variants'
          ) {
            // Avoid serializing File objects inside variants; autosave uploads files separately.
            if (key === 'variants') {
              const sanitized = (payload.variants || []).map((v) => ({
                type: v?.type,
                value: v?.value,
                colorHex: v?.colorHex,
                price: v?.price,
                compareAtPrice: v?.compareAtPrice,
                sku: v?.sku,
                dispatchDeliveryDays: v?.dispatchDeliveryDays,
                image: v?.image || '',
              }));
              formData.append(key, JSON.stringify(sanitized));
            } else {
              formData.append(key, JSON.stringify(payload[key]));
            }
          } else if (key === 'policies') {
            formData.append('policies', JSON.stringify(payload.policies));
          } else if (key === 'deliveryInput') {
            // UI-only
          } else if (key === 'description') {
            // backend partial autosave is tolerant, but avoid sending undefined
            const desc = payload.description || '';
            formData.append(key, desc);
          } else {
            formData.append(key, payload[key]);
          }
        });

        productImages.forEach((img) => {
          if (img.file) formData.append('images', img.file);
        });

        (payload.variants || []).forEach((v) => {
          if (v?.imageFile) formData.append('variantImages', v.imageFile);
        });

        setAutoSaving(true);
        setAutoSaveMsg('Auto-saving...');

        const productId = draftId || editingProduct?._id;
        const endpoint = productId ? `/products/${productId}/autosave` : '/products/autosave';
        const { data } = await api.patch(endpoint, formData);

        if (!draftId && data?.product?._id) {
          setDraftId(data.product._id);
        }

        setAutoSaveMsg(data?.message || 'Auto-saved');
        lastAutosaveSignatureRef.current = currentSignature;
      } catch (err) {
        const payload = err?.response?.data;
        if (payload?.code === 'PREMIUM_REQUIRED') {
          openUpgradeModal(payload.upgradeFeature || 'premium', {
            autoRedirect: Boolean(payload.autoRedirect),
          });
        }
        setAutoSaveMsg(payload?.message || 'Autosave failed');
      } finally {
        setAutoSaving(false);
      }
    }, 1200);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, editingProduct, productData, productImages, draftId]);

  const toggleShipFromStoreAddress = (addr) => {
    const current = productData.shipFromStoreAddresses || [];
    const max = inventoryOptions?.maxStoreAddresses ?? 1;
    if (current.includes(addr)) {
      setProductData({
        ...productData,
        shipFromStoreAddresses: current.filter((a) => a !== addr),
      });
    } else if (max <= 1) {
      setProductData({ ...productData, shipFromStoreAddresses: [addr] });
    } else {
      setProductData({
        ...productData,
        shipFromStoreAddresses: [...current, addr],
      });
    }
  };

  // Bulk Product State
  const [csvFile, setCsvFile] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkMsg, setBulkMsg] = useState('');

  // My Store
  const [myStore, setMyStore] = useState(null);
  const [hasStore, setHasStore] = useState(false);
  const [platformHost, setPlatformHost] = useState('aashansh.org');
  const [storeView, setStoreView] = useState('hub'); // hub | create | edit
  const [storeLoading, setStoreLoading] = useState(false);
  const [storeMsg, setStoreMsg] = useState('');
  const [storeAddressOptions, setStoreAddressOptions] = useState({
    allowMultipleAddresses: false,
    storeAddressHint: '',
  });
  const [canCreateMoreStores, setCanCreateMoreStores] = useState(false);
  const [isSubscribedSeller, setIsSubscribedSeller] = useState(false);
  const defaultStoreForm = {
    storeName: '',
    keywordsInput: '',
    detailedAddress: '',
    additionalAddresses: [],
    domainType: 'platform_subdomain',
    customDomain: '',
    subdomain: '',
    isActive: true,
  };
  const [storeForm, setStoreForm] = useState(defaultStoreForm);
  const [storeLogoFile, setStoreLogoFile] = useState(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState(null);
  const [storeFaviconFile, setStoreFaviconFile] = useState(null);
  const [storeFaviconPreview, setStoreFaviconPreview] = useState(null);
  const [sellerMeta, setSellerMeta] = useState({
    officialName: '',
    businessName: '',
    elevatorPitch: '',
  });

  const fetchMyStore = async () => {
    try {
      const { data } = await api.get('/seller/store');
      setMyStore(data.store);
      setHasStore(data.hasStore);
      if (data.platformHost) setPlatformHost(data.platformHost);
      if (data.sellerMeta) setSellerMeta(data.sellerMeta);
      setStoreAddressOptions({
        allowMultipleAddresses: Boolean(data.allowMultipleAddresses),
        storeAddressHint: data.storeAddressHint || '',
      });
      setCanCreateMoreStores(Boolean(data.canCreateMoreStores));
      setIsSubscribedSeller(Boolean(data.isSubscribedSeller));
      if (data.store) {
        setStoreForm({
          storeName: data.store.storeName || '',
          keywordsInput: (data.store.keywords || []).join(', '),
          detailedAddress: data.store.detailedAddress || '',
          additionalAddresses: data.allowMultipleAddresses
            ? data.store.additionalAddresses || []
            : [],
          domainType: data.store.domainType || 'platform_subdomain',
          customDomain: data.store.customDomain || '',
          subdomain: data.store.subdomain || '',
          isActive: data.store.isActive !== false,
        });
        setStoreLogoPreview(null);
        setStoreLogoFile(null);
        setStoreFaviconPreview(null);
        setStoreFaviconFile(null);
      }
    } catch (err) {
      console.error('Fetch store:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'store') {
      setStoreView('hub');
      fetchMyStore();
    }
  }, [activeTab]);

  const saveStoreAutosave = useCallback(
    async (form) => {
      const formData = new FormData();
      if (form.storeName) formData.append('storeName', form.storeName);
      if (form.keywordsInput) formData.append('keywords', form.keywordsInput);
      if (form.detailedAddress) formData.append('detailedAddress', form.detailedAddress);
      const extra = (form.additionalAddresses || []).filter((a) => String(a).trim());
      if (extra.length) formData.append('additionalAddresses', JSON.stringify(extra));
      if (storeView === 'edit') formData.append('isActive', form.isActive !== false);
      if (storeLogoFile) formData.append('logo', storeLogoFile);
      if (storeFaviconFile) formData.append('favicon', storeFaviconFile);

      if (storeView === 'edit' && hasStore) {
        const { data } = await api.patch('/seller/store', formData);
        return data;
      }
      const { data } = await api.put('/form-drafts/seller.store.create', { data: form });
      return data;
    },
    [storeView, hasStore, storeLogoFile, storeFaviconFile]
  );

  const {
    status: storeAutosaveStatus,
    message: storeAutosaveMessage,
    clearDraft: clearStoreDraft,
  } = useFormAutosave({
    formKey: storeView === 'edit' ? 'seller.store.edit' : 'seller.store.create',
    value: storeForm,
    enabled: activeTab === 'store' && (storeView === 'create' || storeView === 'edit'),
    restore: storeView === 'create',
    onRestore: (data) => setStoreForm((prev) => ({ ...defaultStoreForm, ...prev, ...data })),
    saveFn: saveStoreAutosave,
    isEmpty: (form) =>
      !String(form.storeName || '').trim() &&
      !String(form.detailedAddress || '').trim() &&
      !String(form.keywordsInput || '').trim(),
  });

  const openCreateStore = () => {
    setStoreForm({ ...defaultStoreForm });
    setStoreLogoFile(null);
    setStoreLogoPreview(null);
    setStoreFaviconFile(null);
    setStoreFaviconPreview(null);
    setStoreMsg('');
    setStoreView('create');
  };

  const handleCreateStoreClick = () => {
    if (hasStore && !canCreateMoreStores) {
      openUpgradeModal('multiple_stores');
      return;
    }
    openCreateStore();
  };

  const openEditStore = () => {
    if (!hasStore) {
      setStoreMsg('Create your store first.');
      return;
    }
    setStoreMsg('');
    setStoreView('edit');
  };

  const handleStoreSubmit = async (e) => {
    e.preventDefault();
    const hasLogo = Boolean(storeLogoFile || myStore?.logo);
    if (
      !isStoreFormValid(storeForm, {
        ...storeAddressOptions,
        requireLogo: storeView === 'create',
        hasLogo,
      })
    ) {
      setStoreMsg(
        storeView === 'create' && !hasLogo
          ? 'Please upload a store logo before creating your store.'
          : 'Please fix validation errors before saving.'
      );
      return;
    }
    setStoreLoading(true);
    setStoreMsg('');

    const formData = new FormData();
    formData.append('storeName', storeForm.storeName);
    formData.append('keywords', storeForm.keywordsInput);
    formData.append('detailedAddress', storeForm.detailedAddress);
    const extra = (storeForm.additionalAddresses || []).filter((a) => a.trim());
    formData.append('additionalAddresses', JSON.stringify(extra));

    if (storeView === 'edit') {
      formData.append('isActive', storeForm.isActive);
    }
    if (storeLogoFile) {
      formData.append('logo', storeLogoFile);
    }
    if (storeFaviconFile) {
      formData.append('favicon', storeFaviconFile);
    }

    try {
      if (storeView === 'create') {
        const { data } = await api.post('/seller/store', formData);
        await clearStoreDraft();
        setStoreMsg(data.message || 'Store created!');
        setMyStore(data.store);
        setHasStore(true);
        setStoreView('hub');
      } else {
        const { data } = await api.put('/seller/store', formData);
        setStoreMsg(data.message || 'Store updated!');
        setMyStore(data.store);
        setStoreView('hub');
      }
      setStoreLogoFile(null);
      setStoreLogoPreview(null);
      setStoreFaviconFile(null);
      setStoreFaviconPreview(null);
      await fetchMyStore();
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.code === 'PREMIUM_REQUIRED') {
        openUpgradeModal(payload.upgradeFeature || 'premium', {
          autoRedirect: Boolean(payload.autoRedirect),
        });
      }
      setStoreMsg(payload?.message || 'Failed to save store');
    } finally {
      setStoreLoading(false);
    }
  };

  const handleDeleteProduct = async (product) => {
    if (isProductLocked(product)) {
      alert(getProductLockMessage(product.title));
      return;
    }
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.delete(`/products/${product._id}`);
      fetchMyProducts();
    } catch (err) {
      const lock = getApiLockPayload(err);
      if (lock?.whatsappUrl) {
        alert(lock.message);
        return;
      }
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  const handleEditInit = (product) => {
    if (isProductLocked(product)) {
      return;
    }
    setEditingProduct(product);
    setProductData({
      title: product.title,
      description: product.description,
      price: product.price,
      compareAtPrice: product.compareAtPrice || '',
      unitPrice: product.unitPrice || '',
      chargeTax: product.chargeTax || false,
      category: product.category,
      premiumType: product.premiumType || '',
      stock: product.stock,
      locations: product.locations && product.locations.length > 0 ? product.locations : [{ address: 'Main Shop Location', stock: product.stock || 0 }],
      inventoryTracked: product.inventoryTracked !== undefined ? product.inventoryTracked : true,
      sku: product.sku || '',
      purchaseType: product.purchaseType || 'one_time',
      shipFromStoreAddresses: product.shipFromStoreAddresses || [],
      barcode: product.barcode || '',
      continueSellingWhenOutOfStock: product.continueSellingWhenOutOfStock || false,
      isPhysicalProduct: product.isPhysicalProduct !== undefined ? product.isPhysicalProduct : true,
      packageType: product.packageType || 'Store default - Sample box - 22 x 13.7 x 4.2 cm, 0 kg',
      packageLength: product.packageLength || '',
      packageWidth: product.packageWidth || '',
      packageHeight: product.packageHeight || '',
      packageDimensionsUnit: product.packageDimensionsUnit || 'cm',
      productWeight: product.productWeight || 0,
      productWeightUnit: product.productWeightUnit || 'g',
      deliveryBy: product.deliveryBy || '',
      deliveryInput: '',
      deliveryValues: product.deliveryValues || [],
      pageTitle: product.pageTitle || '',
      metaDescription: product.metaDescription || '',
      urlHandle: product.urlHandle || '',
      keywords: product.keywords ? product.keywords.join(', ') : '',
      policies: clonePolicies(product.policies),
      careInstructions: product.careInstructions || '',
      keyHighlights: product.keyHighlights || '',
      dispatchDeliveryDays: product.dispatchDeliveryDays ?? '',
      minOrderQuantity: product.minOrderQuantity ?? 1,
      maxOrderQuantity: product.maxOrderQuantity ?? 5,
      bulkPurchaseEnabled: product.bulkPurchaseEnabled === true,
      bulkPurchaseMinOrderQuantity: product.bulkPurchaseMinOrderQuantity ?? 50,
      variants: (product.variants || []).map((v) => ({ ...v, imageFile: null, imagePreview: '' })),
    });
    setProductImages(
      (product.images || []).map((path, i) => ({
        id: `existing-${i}`,
        preview: `${BASE_URL}/${path.replace(/\\/g, '/')}`,
        existingPath: path,
      }))
    );
    hydratedDraftRef.current = true;
    skipNextAutosaveRef.current = true;
    setTimeout(() => {
      skipNextAutosaveRef.current = false;
    }, 0);
    setActiveTab('single'); // Switch to the form view
  };

  const handleSingleSubmit = async (e) => {
    e.preventDefault();
    if (isProductLocked(editingProduct)) {
      setSingleMsg(getProductLockMessage(editingProduct?.title));
      return;
    }
    const policiesForSave = normalizePoliciesForSave(productData.policies);
    const payload = { ...productData, policies: policiesForSave };
    if (!inventoryOptions?.isSubscribedSeller) {
      payload.bulkPurchaseEnabled = false;
    }

    const categoryCheck = validateFreeSellerCategorySelection(payload, inventoryOptions);
    if (!categoryCheck.ok) {
      if (categoryCheck.reason === 'mismatch') {
        openUpgradeModal('free_category_path', { autoRedirect: true });
        return;
      }
      setSingleMsg(
        'Please select Main Category, Sub-Category, and Type. If you chose "Other (Please mention)", fill in the text field below that dropdown.'
      );
      return;
    }

    if (!isProductFormContentValid(payload, inventoryOptions)) {
      setSingleMsg('Please complete required fields before saving.');
      return;
    }
    setSingleLoading(true);
    setSingleMsg('');

    const formData = new FormData();
    // If we have an autosaved draft, convert that draft into the final submitted product.
    if (!editingProduct && draftId) {
      formData.append('draftId', draftId);
    }
    Object.keys(payload).forEach(key => {
      if (key === 'locations' || key === 'shipFromStoreAddresses' || key === 'deliveryValues' || key === 'variants') {
        formData.append(key, JSON.stringify(payload[key]));
      } else if (key === 'policies') {
        formData.append('policies', JSON.stringify(payload.policies));
      } else if (key === 'deliveryInput') {
        /* UI-only; values sent via deliveryValues */
      } else {
        formData.append(key, payload[key]);
      }
    });
    productImages.forEach((img) => {
      if (img.file) formData.append('images', img.file);
    });

    // Variant images (optional). Order matches variants array.
    (payload.variants || []).forEach((v) => {
      if (v?.imageFile) formData.append('variantImages', v.imageFile);
    });
    if (editingProduct) {
      const kept = productImages
        .filter((img) => img.existingPath && !img.file)
        .map((img) => img.existingPath);
      formData.append('existingImages', JSON.stringify(kept));
    }

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, formData);
        setSingleMsg('Product updated successfully!');
        setEditingProduct(null);
      } else {
        await api.post('/products', formData);
        setSingleMsg('Product added successfully. Pending admin approval!');
      }
      // Clear autosaved draft state after final submit.
      setDraftId(null);
      setAutoSaveMsg('');
      setProductData({ ...defaultProductData });
      setProductImages([]);
      fetchMyProducts();
      try {
        const { data: opts } = await api.get('/seller/products/inventory-options');
        setInventoryOptions(opts);
      } catch {
        /* ignore */
      }
    } catch (err) {
      const lock = getApiLockPayload(err);
      const payload = err.response?.data;
      if (payload?.code === 'PREMIUM_REQUIRED') {
        openUpgradeModal(payload.upgradeFeature || 'premium', {
          autoRedirect: Boolean(payload.autoRedirect),
        });
      }
      setSingleMsg(
        lock?.message ||
          payload?.message ||
          (editingProduct ? 'Failed to update product' : 'Failed to add product')
      );
    } finally {
      setSingleLoading(false);
    }
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (!csvFile) return;
    setBulkLoading(true);
    setBulkMsg('');

    const formData = new FormData();
    formData.append('file', csvFile);

    try {
      await api.post('/products/bulk', formData);
      setBulkMsg('Bulk upload successful! Products pending approval.');
      setCsvFile(null);
    } catch (err) {
      const payload = err.response?.data;
      if (payload?.code === 'PREMIUM_REQUIRED') {
        openUpgradeModal(payload.upgradeFeature || 'premium', {
          autoRedirect: Boolean(payload.autoRedirect),
        });
      }
      setBulkMsg(payload?.message || 'Bulk upload failed');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="animate-fade-in max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Manage Products</h1>

      <UpgradePremiumModal
        open={upgradeModalOpen}
        onClose={() => {
          setUpgradeModalOpen(false);
          setUpgradeAutoRedirect(false);
        }}
        feature={upgradeFeature}
        autoRedirect={upgradeAutoRedirect}
      />

      <div className="flex flex-wrap gap-4 mb-8 border-b border-glass-border pb-2">
        <button
          className={`pb-2 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'store' ? 'border-primary text-primary' : 'border-transparent text-[#94a3b8] hover:text-white'}`}
          onClick={() => {
            setActiveTab('store');
            setStoreView('hub');
            setStoreMsg('');
          }}
        >
          <Store size={18} /> My Store
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 flex items-center gap-2 ${activeTab === 'list' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => {
            setActiveTab('list');
            setEditingProduct(null);
            setSingleMsg('');
          }}
        >
          <List size={18} /> My Products
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'single' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => {
            setActiveTab('single');
            setEditingProduct(null);
            // Start fresh; if a draft exists on the server, draft restore effect will bring it back.
            setDraftId(null);
            setAutoSaveMsg('');
            setProductData({ ...defaultProductData });
            setProductImages([]);
            skipNextAutosaveRef.current = true;
            hydratedDraftRef.current = false;
            setSingleMsg('');
          }}
        >
          {editingProduct ? 'Edit Product' : 'Add Single Product'}
        </button>
        <button 
          className={`pb-2 px-4 font-medium transition-colors border-b-2 ${activeTab === 'bulk' ? 'border-primary text-primary' : 'border-transparent text-text-muted hover:text-white'}`}
          onClick={() => setActiveTab('bulk')}
        >
          Bulk Upload (CSV)
        </button>
      </div>

      <div className="glass-panel p-8 rounded-2xl">
        {activeTab === 'store' ? (
          <div className="text-[#202223]">
            {storeView === 'hub' ? (
              <div className="bg-white rounded-lg border border-[#E1E3E5] p-6 shadow-sm">
                <h2 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#202223]">
                  <Store size={20} /> My Store
                </h2>
                {myStore?.storeUrl && (
                  <div className="mb-6 p-4 rounded-xl border border-[#E1E3E5] bg-[#F6F6F7]">
                    <p className="text-sm text-[#6D7175] mb-1">Your store is live at</p>
                    <a
                      href={myStore.storeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#005bd3] font-medium break-all hover:underline"
                    >
                      {myStore.storeUrl}
                    </a>
                  </div>
                )}
                {myStore?.seo && (
                  <div className="mb-6 p-4 rounded-xl border border-[#E1E3E5] bg-white text-sm">
                    <p className="font-semibold text-[#202223] mb-2">Store SEO</p>
                    <p className="text-[#6D7175]">
                      <span className="font-medium text-[#202223]">Title:</span>{' '}
                      {myStore.seo.metaTitle}
                    </p>
                    <p className="text-[#6D7175] mt-1">
                      <span className="font-medium text-[#202223]">Description:</span>{' '}
                      {myStore.seo.metaDescription || '—'}
                    </p>
                    <p className="text-[#6D7175] mt-1">
                      <span className="font-medium text-[#202223]">Keywords:</span>{' '}
                      {myStore.seo.metaKeywords || '—'}
                    </p>
                  </div>
                )}
                {storeMsg && (
                  <p className={`mb-4 text-sm ${storeMsg.includes('success') || storeMsg.includes('created') || storeMsg.includes('updated') ? 'text-[#008060]' : 'text-[#B98900]'}`}>
                    {storeMsg}
                  </p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl">
                  <button
                    type="button"
                    onClick={handleCreateStoreClick}
                    disabled={hasStore && isSubscribedSeller && !canCreateMoreStores}
                    className="min-h-[120px] rounded-2xl font-bold text-lg text-[#202223] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md flex flex-col items-center justify-center gap-2"
                    style={{ backgroundColor: '#FFD700' }}
                  >
                    <span className="flex items-center gap-2">
                      {hasStore ? 'Add another store' : 'Create Store'}
                      {hasStore && !isSubscribedSeller && (
                        <Zap size={20} className="text-[#B98900]" fill="currentColor" />
                      )}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={openEditStore}
                    disabled={!hasStore}
                    className="min-h-[120px] rounded-2xl font-bold text-lg text-[#202223] transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md"
                    style={{ backgroundColor: '#FFD700' }}
                  >
                    Edit Store
                  </button>
                </div>
                {hasStore && !isSubscribedSeller && (
                  <p className="mt-6 text-sm text-[#6D7175]">
                    Free plan includes <strong className="text-[#202223]">one store</strong>. Use{' '}
                    <strong className="text-[#202223]">Edit Store</strong> to update it, or upgrade to add
                    more storefronts.
                  </p>
                )}
                {hasStore && isSubscribedSeller && (
                  <p className="mt-6 text-sm text-[#6D7175]">
                    {canCreateMoreStores
                      ? 'You can create additional storefronts with Premium.'
                      : 'You have reached the maximum number of stores on your plan.'}{' '}
                    Use <strong className="text-[#202223]">Edit Store</strong> to update your primary store.
                  </p>
                )}
              </div>
            ) : (
              <form onSubmit={handleStoreSubmit} className="max-w-xl text-[#202223]">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-bold text-[#202223]">
                      {storeView === 'create' ? 'Create Store' : 'Edit Store'}
                    </h2>
                    <FormAutosaveStatus status={storeAutosaveStatus} message={storeAutosaveMessage} />
                  </div>
                  <button
                    type="button"
                    className="text-[#6D7175] hover:text-[#202223] text-sm"
                    onClick={() => {
                      setStoreView('hub');
                      setStoreMsg('');
                      setStoreLogoFile(null);
                      setStoreLogoPreview(null);
                      setStoreFaviconFile(null);
                      setStoreFaviconPreview(null);
                    }}
                  >
                    ← Back
                  </button>
                </div>

                <div className="bg-white rounded-lg border border-[#E1E3E5] p-6 shadow-sm text-[#202223]">
                  <StoreFormFields
                    storeForm={storeForm}
                    setStoreForm={setStoreForm}
                    platformHost={platformHost}
                    storeView={storeView}
                    logoPreview={storeLogoPreview}
                    setLogoPreview={setStoreLogoPreview}
                    setLogoFile={setStoreLogoFile}
                    existingLogoPath={myStore?.logo}
                    faviconPreview={storeFaviconPreview}
                    setFaviconPreview={setStoreFaviconPreview}
                    setFaviconFile={setStoreFaviconFile}
                    existingFaviconPath={myStore?.favicon}
                    sellerMeta={sellerMeta}
                    allowMultipleAddresses={storeAddressOptions.allowMultipleAddresses}
                    storeAddressHint={storeAddressOptions.storeAddressHint}
                    onRequestUpgrade={openUpgradeModal}
                  />
                </div>

                {storeMsg && (
                  <p className={`mt-4 text-sm ${storeMsg.includes('success') || storeMsg.includes('created') || storeMsg.includes('updated') ? 'text-[#008060]' : 'text-[#D82C0D]'}`}>
                    {storeMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={
                    storeLoading ||
                    !isStoreFormValid(storeForm, {
                      ...storeAddressOptions,
                      requireLogo: storeView === 'create',
                      hasLogo: Boolean(storeLogoFile || myStore?.logo),
                    })
                  }
                  className="mt-6 w-full sm:w-auto disabled:opacity-50 bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2 px-6 rounded-md text-[14px]"
                >
                  {storeLoading ? 'Saving...' : storeView === 'create' ? 'Create Store' : 'Save Changes'}
                </button>
              </form>
            )}
          </div>
        ) : activeTab === 'list' ? (
          <div>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><List size={20} /> Your Uploaded Products</h2>
            {loadingProducts ? (
              <div className="p-8 text-center text-text-muted">Loading products...</div>
            ) : myProducts.length === 0 ? (
              <div className="p-8 text-center text-text-muted">You haven't uploaded any products yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-glass-border">
                      <th className="p-4 text-text-muted font-medium">Image</th>
                      <th className="p-4 text-text-muted font-medium">Title</th>
                      <th className="p-4 text-text-muted font-medium">Price</th>
                      <th className="p-4 text-text-muted font-medium">Stock</th>
                      <th className="p-4 text-text-muted font-medium">Status</th>
                      <th className="p-4 text-text-muted font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myProducts.map((product) => (
                      <tr key={product._id} className="border-b border-glass-border/50 hover:bg-white/5 transition-colors">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded-lg bg-surface flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                              <img src={`${BASE_URL}/${product.images[0].replace(/\\/g, '/')}`} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-text-muted" />
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-medium">{product.title}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            {product.compareAtPrice && product.compareAtPrice > product.price && (
                              <span className="text-[10px] text-text-muted line-through">Rs. {product.compareAtPrice.toFixed(2)}</span>
                            )}
                            <span>Rs. {product.price.toFixed(2)}</span>
                          </div>
                        </td>
                        <td className="p-4">{product.stock}</td>
                        <td className="p-4">
                          {product.approvalStatus === 'approved' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-success/20 text-success px-2 py-1 rounded-full"><CheckCircle size={12}/> Approved</span>}
                          {product.approvalStatus === 'pending' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-warning/20 text-warning px-2 py-1 rounded-full"><Clock size={12}/> Under Approval</span>}
                          {product.approvalStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-error/20 text-error px-2 py-1 rounded-full"><XCircle size={12}/> Rejected</span>}
                          {product.approvalStatus === 'deleted' && <span className="inline-flex items-center gap-1 text-xs font-bold bg-error/20 text-error px-2 py-1 rounded-full"><XCircle size={12}/> Deleted</span>}
                          {product.isActive === false && <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold bg-glass-border/20 text-text-muted px-2 py-1 rounded-full">Unlisted</span>}
                        </td>
                        <td className="p-4 text-right">
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={() => setActionOpenId(actionOpenId === product._id ? null : product._id)}
                              className="p-2 bg-surface hover:bg-primary/20 text-primary transition-colors rounded-lg"
                              title="Actions"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M6 10a2 2 0 114 0 2 2 0 01-4 0zm6 0a2 2 0 114 0 2 2 0 01-4 0z" /></svg>
                            </button>
                            {actionOpenId === product._id && (
                              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-glass-bg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                                <div className="py-1">
                                  {product.approvalStatus === 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() => { window.open(getApprovedProductWhatsAppUrl(product.title), '_blank'); }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface"
                                    >
                                      Request for edits (On chat)
                                    </button>
                                  )}
                                  {product.approvalStatus !== 'approved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleEditInit(product)}
                                      className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface"
                                    >
                                      Edit product
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteProduct(product)}
                                    className="w-full text-left px-4 py-2 text-sm text-error hover:bg-surface"
                                  >
                                    Delete product
                                  </button>
                                  {product.isActive !== false && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await api.patch(`/products/${product._id}/active`, { isActive: false });
                                        fetchMyProducts();
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface"
                                    >
                                      Un-list product
                                    </button>
                                  )}
                                  {product.isActive === false && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        await api.patch(`/products/${product._id}/active`, { isActive: true });
                                        fetchMyProducts();
                                      }}
                                      className="w-full text-left px-4 py-2 text-sm text-text-muted hover:bg-surface"
                                    >
                                      Make it live
                                    </button>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : activeTab === 'single' ? (
          <form onSubmit={handleSingleSubmit} className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              {editingProduct && (
                <button type="button" onClick={() => { setEditingProduct(null); setActiveTab('list'); }} className="text-text-muted hover:text-white">
                  <X size={24} />
                </button>
              )}
            </div>

            {isProductLocked(editingProduct) && (
              <ApprovedProductLockBanner product={editingProduct} className="mb-4" />
            )}
            
            <fieldset
              disabled={isProductLocked(editingProduct)}
              className={`border-0 p-0 m-0 min-w-0 ${isProductLocked(editingProduct) ? 'opacity-60 pointer-events-none' : ''}`}
            >
            <div className="space-y-6">
                {/* 1. TITLE, DESCRIPTION, IMAGES */}
                <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm p-5">
                  <ProductBasicFields
                    productData={productData}
                    setProductData={setProductData}
                    productImages={productImages}
                    setProductImages={setProductImages}
                    inventoryOptions={inventoryOptions}
                    editingProduct={editingProduct}
                    onToggleStoreAddress={toggleShipFromStoreAddress}
                    onRequestUpgrade={openUpgradeModal}
                  />
                </div>

                {/* Premium-only extra fields */}
                {inventoryOptions?.isSubscribedSeller && (
                  <div className="bg-white border border-[#E1E3E5] rounded-lg shadow-sm p-5">
                    <ProductPremiumCategoryKeywordsFields
                      productData={productData}
                      setProductData={setProductData}
                    />
                  </div>
                )}

            </div>
            </fieldset>

            {/* FORM FOOTER ACTION */}
            <div className="flex justify-end items-center gap-3 mt-8 pt-6 border-t border-[#E1E3E5]">
              {autoSaveMsg && !isProductLocked(editingProduct) && (
                <span className="text-[13px] font-medium px-3 py-2 rounded-md bg-[#F6F6F7] text-[#6D7175] border border-[#E1E3E5]">
                  {autoSaving ? 'Auto-saving...' : autoSaveMsg}
                </span>
              )}
              {singleMsg && <span className={`text-[14px] font-medium px-4 py-2 rounded-md ${singleMsg.includes('success') ? 'bg-[#D1F2DD] text-[#113C2B]' : 'bg-[#FED3D1] text-[#6E1A17]'}`}>{singleMsg}</span>}
              <button
                type="button"
                className="bg-white border border-[#E1E3E5] hover:bg-[#F6F6F7] text-[#202223] font-medium py-2 px-4 rounded-md transition-all text-[14px]"
                onClick={() => {
                  setEditingProduct(null);
                  setAutoSaveMsg('');
                  setActiveTab('list');
                }}
              >
                {isProductLocked(editingProduct) ? 'Back to list' : 'Discard'}
              </button>
              {!isProductLocked(editingProduct) && (
                <button type="submit" className="bg-[#008060] hover:bg-[#006e52] text-white font-medium py-2 px-6 rounded-md shadow-sm transition-all text-[14px]" disabled={singleLoading}>
                  {singleLoading ? 'Saving...' : 'Save'}
                </button>
              )}
            </div>
          </form>
        ) : (
          <form onSubmit={handleBulkSubmit} className="space-y-6 text-center max-w-md mx-auto py-8">
            <FileSpreadsheet size={64} className="text-primary mx-auto mb-4" />
            <h2 className="text-xl font-bold">Upload Products via CSV</h2>
            <p className="text-text-muted text-sm mb-6">Download our CSV template, fill in your product details, and upload it here to add multiple products at once.</p>
            
            <div className="border-2 border-dashed border-glass-border rounded-xl p-8 relative hover:bg-surface/50">
              <input type="file" accept=".csv" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setCsvFile(e.target.files[0])} />
              <Upload size={32} className="text-text-muted mx-auto mb-2" />
              <p className="font-medium">{csvFile ? csvFile.name : 'Select CSV File'}</p>
            </div>

            {bulkMsg && <div className={`p-3 rounded-md text-sm ${bulkMsg.includes('success') ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>{bulkMsg}</div>}

            <button type="submit" className="btn btn-primary w-full" disabled={!csvFile || bulkLoading}>
              {bulkLoading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SellerProducts;
