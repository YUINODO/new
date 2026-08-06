# notebooks

JPNB(Jupyter Notebook)方式によるデータ分析ノートブックを置くディレクトリ。

## sediment_hazard_eda.ipynb

東京都の「土砂災害警戒区域等」オープンデータ(シェープファイル、以下5データセット)を対象とした EDA(探索的データ分析)ノートブック。

- `area`(区市町村の行政区域)
- `mesh`(地図メッシュ)
- `keikai_doseki`(土石流 警戒区域・特別警戒区域)
- `keikai_jisuberi`(地滑り 警戒区域)
- `keikai_kyukei`(急傾斜地の崩壊 警戒区域・特別警戒区域)

実行結果(表・グラフ)を埋め込んだ状態で保存済みのため、GitHub 上でそのまま閲覧できる。`sediment_hazard_eda.html` は同内容の静的 HTML 版。

### 再実行する場合

元データ(shp 一式)はサイズが大きいためリポジトリには含めていない。再実行するには、このディレクトリ直下に以下のレイアウトで元データを配置する。

```
notebooks/data/area/area_20260806.shp (+ .dbf/.shx/.prj/.cpg)
notebooks/data/mesh/mesh_20260806.shp (+ ...)
notebooks/data/keikai_doseki/d_rzone_20260806.shp, d_yzone_20260806.shp (+ ...)
notebooks/data/keikai_jisuberi/j_yzone_20260806.shp (+ ...)
notebooks/data/keikai_kyukei/k_rzone_20260806.shp, k_yzone_20260806.shp (+ ...)
```

必要な Python パッケージ:

```bash
pip install pandas geopandas shapely matplotlib jupyter nbconvert
```

実行:

```bash
jupyter nbconvert --to notebook --execute --inplace notebooks/sediment_hazard_eda.ipynb
```

日本語ラベルの描画には IPAGothic 等の日本語フォントが必要(Linux 環境では `fonts-japanese-gothic` 等)。
