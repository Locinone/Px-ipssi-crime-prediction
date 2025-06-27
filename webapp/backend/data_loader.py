#data_loader.py

import pandas as pd
from shapely.geometry import Point

def load_data(path):
    df = (
        pd.read_csv(
            path,
            usecols=['CMPLNT_NUM','BORO_NM','CMPLNT_FR_DT','OFNS_DESC','Latitude','Longitude'],
            parse_dates=['CMPLNT_FR_DT']
        )
        .dropna(subset=['Latitude','Longitude'])
    )
    df['geometry'] = df.apply(lambda r: Point(r.Longitude, r.Latitude), axis=1)
    df['BORO_NM']    = df['BORO_NM'].astype('category')
    df['OFNS_DESC'] = df['OFNS_DESC'].astype('category')
    # **ON SUPPRIME** la mise en index sur CMPLNT_FR_DT
    return df

DF = load_data(r"C:\Users\Nassim\Downloads\NYPD_Complaint_Data_Current__Year_To_Date__20250625.csv")
