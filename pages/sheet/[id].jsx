import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Image from 'next/image';

import { Grid, Container } from '@mui/material';
import { withStyles } from '@mui/styles';
import { PrismaClient } from '@prisma/client';

import { api } from '../../utils';

import {
  Header, Section, StatusBar, StatusBarModal
} from '../../components';

import {
  CharacterInfoForm
} from '../../components/forms';

import useModal from '../../hooks/useModal';

const prisma = new PrismaClient();

export const getServerSideProps = async ({ params }) => {
  const characterId = isNaN(params.id) ? null : Number(params.id);

  if(!characterId) {
    return {
      props: {
        character: null
      }
    }
  }

  const character = await prisma.character.findUnique({
    where: {
      id: characterId
    }
  });

  if(!character) {
    return {
      props: {
        character: null
      }
    }
  }

  const serialized = JSON.parse(JSON.stringify(character));

  return {
    props: {
      rawCharacter: serialized
    }
  }
}

function Sheet({
  classes,
  rawCharacter
}) {
  const [character, setCharacter] = useState(rawCharacter);

  const onCharacterInfoSubmit = async values => {
    return new Promise((resolve, reject) => {
      api.put(`/character/${character.id}`, values)
      .then(() => {
        resolve();
      })
      .catch(() => {
        reject();
      });
    });
  }

  const onHitPointsModalSubmit = async newData => {
    return new Promise((resolve, reject) => {
      const data = {
        current_hit_points: Number(newData.current),
        max_hit_points: Number(newData.max)
      }

      api
        .put(`/character/${character.id}`, data)
        .then(() => {
          updateCharacterState(data);

          resolve();
        })
        .catch(err => {
          alert(`Erro ao atualizar a vida!`, err);

          reject();
        });
    });
  }

  useEffect(() => {
    setCharacter(rawCharacter);
  }, [rawCharacter]);

  const updateCharacterState = data => {
    return setCharacter(prevState => ({
      ...prevState,
      ...data
    }));
  }

  const hitPointsModal = useModal(({ close }) => (
    <StatusBarModal
      type="hp"
      onSubmit={async newData => {
        onHitPointsModalSubmit(newData).then(() => close());
      }}
      handleClose={close}
      data={{
        current: character.current_hit_points,
        max: character.max_hit_points
      }}
    />
  ));

  if(!rawCharacter) {
    return (
      <div>Personagem não existe!</div>
    );
  }

  return (
    <Container maxWidth="lg" style={{ marginBottom: '30px' }}>
        <Head>
          <title>Ficha de {character.name} | RPG</title>
        </Head>

        <Grid container item spacing={3}>
          <Header title={`Ficha de ${character.name}`} />

          <Grid container item xs={12} spacing={3}>
            <Grid item xs={12} md={6}>
              <Section
                title="Detalhes pessoais"
              >
                <Grid container item xs={12} spacing={3}>
                  <Grid item xs={12}>
                    <CharacterInfoForm
                      initialValues={character}
                      onSubmit={onCharacterInfoSubmit}
                    />
                  </Grid>
                </Grid>
              </Section>
            </Grid>
            <Grid item xs={12} md={6}>
              <Section>
                <Grid container item xs={12} spacing={3}>
                  <Grid item xs={12} className={classes.alignCenter}>
                    <Image
                      src={`/assets/default.png`}
                      alt="Character Portrait"
                      className={classes.characterImage}
                      width="200"
                      height="200"
                    />
                  </Grid>
                  <Grid item xs={12} className={classes.alignCenter}>
                    <Grid container item xs={12} className={classes.bar}>
                      <Grid item xs={12} className={classes.barTitle}>
                        <span>Vida</span>
                      </Grid>
                      <Grid item xs={12}>
                        <StatusBar
                          current={character.current_hit_points}
                          max={character.max_hit_points}
                          label={`${character.current_hit_points}/${character.max_hit_points}`}
                          primaryColor="#E80A67"
                          secondaryColor="#4d0321"
                          onClick={() => {
                            hitPointsModal.appear();
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                </Grid>
              </Section>
            </Grid>
          </Grid>
        </Grid>
      </Container>
  )
}

const styles = (theme) => ({
  characterImage: {
    width: '200px',
    borderRadius: '50%'
  },

  alignCenter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  },

  bar: {
    marginBottom: '15px'
  },

  barTitle: {
    marginBottom: '10px',
    color: theme.palette.secondary.main,
    textTransform: 'uppercase',
    fontSize: '18px',
    fontWeight: 'bold'
  }
});

export default withStyles(styles)(Sheet);
