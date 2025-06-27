import requests
from neo4j import GraphDatabase
import time
import json

def clean_crime(crime):
    # Example: Only keep records with valid coordinates and required fields
    if not crime.get("latitude") or not crime.get("longitude"):
        return None
    # Convert types if needed
    try:
        crime["latitude"] = float(crime["latitude"])
        crime["longitude"] = float(crime["longitude"])
    except (ValueError, TypeError):
        return None
    # Add more cleaning rules as needed
    return crime

# NYC Open Data API endpoint (example, can be adjusted for more data)
API_URL = "https://data.cityofnewyork.us/resource/9s4h-37hy.json?$limit=1000"

# Neo4j connection details (Docker Compose service name and default credentials)
NEO4J_URI = "bolt://neo4j:7687"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "test1234"

SHOOTING_API_URL = "https://data.cityofnewyork.us/resource/833y-fsy8.json?$limit=1000"
SECTOR_API_URL = "https://data.cityofnewyork.us/resource/5rqd-h5ci.json?$limit=1000"

def fetch_nyc_crime_data():
    response = requests.get(API_URL)
    response.raise_for_status()
    return response.json()

def fetch_shooting_data():
    response = requests.get(SHOOTING_API_URL)
    response.raise_for_status()
    return response.json()

def fetch_sector_data():
    response = requests.get(SECTOR_API_URL)
    response.raise_for_status()
    return response.json()

def insert_crimes_to_neo4j(crimes):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    def insert_crime(tx, crime):
        tx.run(
            """
            MERGE (c:Crime {id: $id})
            SET c.borough = $borough, c.ofns_desc = $ofns_desc, c.law_cat_cd = $law_cat_cd, c.latitude = $latitude, c.longitude = $longitude, c.cmplnt_fr_dt = $cmplnt_fr_dt
            """,
            id=crime.get("cmplnt_num"),
            borough=crime.get("boro_nm"),
            ofns_desc=crime.get("ofns_desc"),
            law_cat_cd=crime.get("law_cat_cd"),
            latitude=crime.get("latitude"),
            longitude=crime.get("longitude"),
            cmplnt_fr_dt=crime.get("cmplnt_fr_dt"),
        )
    with driver.session() as session:
        for crime in crimes:
            session.write_transaction(insert_crime, crime)
    driver.close()

def clean_shooting(incident):
    # Example: Only keep records with valid coordinates
    if not incident.get("latitude") or not incident.get("longitude"):
        return None
    try:
        incident["latitude"] = float(incident["latitude"])
        incident["longitude"] = float(incident["longitude"])
    except (ValueError, TypeError):
        return None
    return incident

def insert_shootings_to_neo4j(incidents):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    def insert_incident(tx, incident):
        tx.run(
            """
            MERGE (s:ShootingIncident {id: $id})
            SET s.boro = $boro, s.occur_date = $occur_date, s.latitude = $latitude, s.longitude = $longitude, s.perp_age_group = $perp_age_group, s.vic_age_group = $vic_age_group
            """,
            id=incident.get("incident_key"),
            boro=incident.get("boro"),
            occur_date=incident.get("occur_date"),
            latitude=incident.get("latitude"),
            longitude=incident.get("longitude"),
            perp_age_group=incident.get("perp_age_group"),
            vic_age_group=incident.get("vic_age_group"),
        )
    with driver.session() as session:
        for incident in incidents:
            session.write_transaction(insert_incident, incident)
    driver.close()

def insert_sectors_to_neo4j(sectors):
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    def insert_sector(tx, sector):
        tx.run(
            """
            MERGE (ps:PoliceSector {sector: $sector, pct: $pct})
            SET ps.patrol_bor = $patrol_bor, ps.sq_miles = $sq_miles, ps.nco_phase = $nco_phase, ps.sector_ind = $sector_ind, ps.the_geom = $the_geom
            """,
            sector=sector.get("sector"),
            pct=sector.get("pct"),
            patrol_bor=sector.get("patrol_bor"),
            sq_miles=sector.get("sq_miles"),
            nco_phase=sector.get("nco_phase"),
            sector_ind=sector.get("sector_ind"),
            the_geom=json.dumps(sector.get("the_geom")),
        )
    with driver.session() as session:
        for sector in sectors:
            session.write_transaction(insert_sector, sector)
    driver.close()

def main():
    print("Fetching NYC crime data...")
    crimes = fetch_nyc_crime_data()
    print(f"Fetched {len(crimes)} records. Cleaning data...")
    cleaned_crimes = [clean_crime(c) for c in crimes]
    cleaned_crimes = [c for c in cleaned_crimes if c is not None]
    print(f"{len(cleaned_crimes)} records after cleaning. Inserting into Neo4j...")
    insert_crimes_to_neo4j(cleaned_crimes)
    print("Fetching NYPD Shooting Incident data...")
    shootings = fetch_shooting_data()
    print(f"Fetched {len(shootings)} shooting records. Cleaning data...")
    cleaned_shootings = [clean_shooting(s) for s in shootings]
    cleaned_shootings = [s for s in cleaned_shootings if s is not None]
    print(f"{len(cleaned_shootings)} shooting records after cleaning. Inserting into Neo4j...")
    insert_shootings_to_neo4j(cleaned_shootings)
    print("Fetching NYPD Police Sector data...")
    sectors = fetch_sector_data()
    print(f"Fetched {len(sectors)} police sector records. Inserting into Neo4j...")
    insert_sectors_to_neo4j(sectors)
    print("Done with all batches.")

if __name__ == "__main__":
    main() 