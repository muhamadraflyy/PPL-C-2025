import { useEffect, useState } from "react";
import api from "../utils/axiosConfig";

export default function useSubCategories(kategoriId) {
  const [subCategories, setSubCategories] = useState([]);
  const [loadingSub, setLoadingSub] = useState(false);
  const [errorSub, setErrorSub] = useState("");

  useEffect(() => {
    if (!kategoriId) {
      setSubCategories([]);
      return;
    }

    let ignore = false;

    async function fetchSubCategories() {
      try {
        setLoadingSub(true);
        setErrorSub("");
        const res = await api.get(`/sub-kategori?id_kategori=${kategoriId}`);
        const data = res?.data?.data || [];
        
        if (!ignore) {
          setSubCategories(data);
        }
      } catch (err) {
        console.error("Gagal memuat sub kategori:", err);
        if (!ignore) {
            setErrorSub("Gagal memuat sub kategori"); 
        }
      } finally {
        if (!ignore) {
          setLoadingSub(false);
        }
      }
    }

    fetchSubCategories();

    return () => {
      ignore = true;
    };
  }, [kategoriId]);

  return { subCategories, loadingSub, errorSub };
}